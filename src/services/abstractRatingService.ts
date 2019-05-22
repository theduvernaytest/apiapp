import {MongoService, Ratings} from './mongoService';
import {assign, find, findIndex, findKey, flatten, map, max, pick, reduce, set, slice, sum, curry, mapValues, values, zip, zipObject, keys} from 'lodash';
import {Question} from '../models/question';
import {Answer, AnswerSubmit, Rating, RawCalculationArguments} from '../models/answer';
import {injectable} from 'inversify';

// Disabling tslint for the const since order matters in this case and the order is not alphabetical
/* tslint:disable */
const SCORE_SCALE = {
    'A': 80,
    'B': 60,
    'C': 40,
    'D': 20,
    'F': 0
};
/* tslint:enable */


type AnswerProcessingResult = {
    result: RatingProcessingResult;
    newMeanRating: Ratings;
    newUsersRating: Ratings;
};

type RatingProcessingResult
    = 'ANSWER_ACCEPTED' | 'TEST_COMPLETED' | 'TEST_STARTED' | 'ATTEMPT_TO_RETAKE_TEST' | 'INVALID_ANSWER';

@injectable()
export abstract class AbstractRatingService<T extends AnswerSubmit> {
    protected constructor(
        protected mongoService: MongoService
    ) { }

    public async isAnswerFinal(
        submittedAnswer: T,
        userId: string
    ): Promise<boolean> {
        const questions = await this.getQuestionsPromise();
        const answers = await this.getAnswers(userId, submittedAnswer);

        return !!(this.isFinalAnswer(answers, questions) && !find(answers, { questionId: submittedAnswer.questionId }));
    }

    public async processAnswer(
        submittedAnswer: T,
        userId: string,
        userShortName: string
    ): Promise<AnswerProcessingResult> {
        const questions = await this.getQuestionsPromise();
        const answers = await this.getAnswers(userId, submittedAnswer);
        const ratings = await this.getAllRatings(submittedAnswer);

        let result: AnswerProcessingResult;

        if ( this.isItAttemptToRetakeTest(answers, questions) ) {

            result = this.buildAttemptToRetakeTestResult();

        } else if ( this.isInvalidAnswer(submittedAnswer, questions) ) {

            result = this.buildInvalidAnswerResult();

        } else if ( this.isTestStarted(answers) ) {

            const updatedAnswers = this.addSubmittedAnswerToAnswersArray(submittedAnswer, answers);
            this.updateRating(updatedAnswers, submittedAnswer, userId, userShortName);
            result = this.buildTestStartedResult();

        } else if ( this.isTestInProgress(submittedAnswer, answers, questions) ) {

            const updatedAnswers = this.addSubmittedAnswerToAnswersArray(submittedAnswer, answers);
            this.updateRating(updatedAnswers, submittedAnswer, userId, userShortName);
            result = this.buildAnswerAcceptedResult();

        } else if ( this.isFinalAnswer(answers, questions) ) {

            const updatedAnswers = this.addSubmittedAnswerToAnswersArray(submittedAnswer, answers);

            const rawArgs = this.getIntermediateValues(updatedAnswers, ratings, questions);
            const usersRating = this.calculateRatingByUser(updatedAnswers, questions);
            const meanRating = this.calculateMeanRating(rawArgs, questions);

            this.finalizeRating(updatedAnswers, rawArgs, usersRating, submittedAnswer, userId, userShortName);

            result = this.buildTestCompletedResult(meanRating, usersRating);

        } else {

            result = this.buildInvalidAnswerResult();

        }

        return result;
    }

    protected abstract getAnswers(userId: string, submittedAnswer: T);
    protected abstract getAllRatings(submittedAnswer: T);
    protected abstract finalizeRating(
        answers: Answer[],
        rawArgs: RawCalculationArguments,
        usersRating: Ratings,
        submittedAnswer: T,
        userId: string,
        userShortName: string
    );
    protected abstract updateRating(answers: Answer[], submittedAnswer: T, userId: string, userShortName: string);

    private addSubmittedAnswerToAnswersArray(submittedAnswer: T, answers: Answer[]): Answer[] {
        const indexOfAnswerForTheQuestion = findIndex(answers, {questionId: submittedAnswer.questionId});
        const newAnswer = pick(submittedAnswer, ['questionId', 'answer']);

        return indexOfAnswerForTheQuestion !== -1
            ? [
                ...slice(answers, 0, indexOfAnswerForTheQuestion),
                newAnswer,
                ...slice(answers, indexOfAnswerForTheQuestion + 1)
            ]
            : [...answers, newAnswer];
    }

    private calculateRatingByUser(answers: Answer[], questions: Question[]): Ratings {
        const rawArgs = this.getIntermediateValues(answers, [], questions);

        return findKey(SCORE_SCALE, (s) => s <= this.calculateRating(rawArgs, questions)) || '?';
    }

    private calculateMeanRating(rawArgs: RawCalculationArguments, questions: Question[]): Ratings {
        return findKey(SCORE_SCALE, (s) => s <= this.calculateRating(rawArgs, questions)) || '?';
    }

    private getIntermediateValues(newAnswers: Answer[], ratings: Rating[], questions: Question[]): RawCalculationArguments {
        if (this.isIntermediateValueExtractableFromRating(ratings)) {
            return this.dynamicallyEvaluateIntermediatesValuesUsingPreviousResults(newAnswers, ratings, questions);
        } else {
            return this.calculateIntermediateValues(newAnswers, ratings, questions);
        }
    }

    private isIntermediateValueExtractableFromRating(ratings: Rating[]): Boolean {
        const lastElement = ratings[0];

        return lastElement && lastElement.rawArgs && lastElement.rawArgs.total > 0;
    }

    private dynamicallyEvaluateIntermediatesValuesUsingPreviousResults(newAnswers: Answer[], ratings: Rating[], questions: Question[]): RawCalculationArguments {
        const previousRawArgs = this.getRawArgs(ratings, 0, questions);

        return this.doSumAnswersAndRawArgs(newAnswers, previousRawArgs, questions);
    }

    private getRawArgs(ratings: Rating[], indexToStartFrom: number, questions: Question[]): RawCalculationArguments {
        const rating = ratings[indexToStartFrom];

        const previousRating = ratings[indexToStartFrom + 1];

        if (previousRating && previousRating.rawArgs) {
            if (rating.rawArgs.total === previousRating.rawArgs.total) {
                const updatedRawArgs = this.getRawArgs(ratings, indexToStartFrom + 1, questions);
                return this.doSumAnswersAndRawArgs(rating.answers, updatedRawArgs, questions);
            }
        }

        return rating.rawArgs;
    }

    private doSumAnswersAndRawArgs(answers: Answer[], prevRawArgs: RawCalculationArguments, questions: Question[]): RawCalculationArguments {
        const sumScoreByQuestion = this.buildSumOfScoresByQuestionMap(answers, questions);

        const rawArgsForCurrentAnswers = {
            sumScoreByQuestion: sumScoreByQuestion,
            total: 1
        };

        return this.sumRawArgs(prevRawArgs, rawArgsForCurrentAnswers);
    }

    private sumRawArgs(summand1: RawCalculationArguments, summand2: RawCalculationArguments): RawCalculationArguments {
        const summand1Values = values(summand1.sumScoreByQuestion);
        const summand2Values = values(summand2.sumScoreByQuestion);

        const zippedValues = zip(summand1Values, summand2Values);

        const summedValues = map(zippedValues, (zippedValue) => (zippedValue[0] || 0) + (zippedValue[1] || 0));

        const result = zipObject(keys(summand1.sumScoreByQuestion), summedValues);

        return {
            sumScoreByQuestion: result,
            total: summand1.total + summand2.total
        };
    }

    private async getQuestionsPromise(): Promise<Question[]> {
        return this.mongoService.getAllQuestions();
    }

    private calculateIntermediateValues(newAnswers: Answer[], ratings: Rating[], questions: Question[]): RawCalculationArguments {
        const existingAnswers = this.extractAnswersFromRatings(ratings);

        const answers = [...newAnswers, ...existingAnswers];

        const sumScoreByQuestion = this.buildSumOfScoresByQuestionMap(answers, questions);

        return {
            sumScoreByQuestion: sumScoreByQuestion,
            total: ratings.length + 1
        };
    }

    private buildSumOfScoresByQuestionMap(answers: Answer[], questions: Question[]) {
        const questionsToScoreMap = this.convertQuestionsToScoreMap(questions);

        const scoresByQuestion = this.convertAnswersToScoreByQuestionsMap(answers, questionsToScoreMap);

        return this.sumScoreByQuestionMap(scoresByQuestion);
    }

    private sumScoreByQuestionMap(scoresByQuestion) {
        return mapValues(scoresByQuestion, (scoresArray) => {
            return sum(scoresArray.filter( (n) => n !== null ));
        });
    }

    private extractAnswersFromRatings(ratings: Rating[]): Answer[] {
        return flatten(map(ratings, (rating) => rating.answers));
    }

    private calculateRating(rawArgs: RawCalculationArguments, questions: Question[]): number {
        const questionsToScoreMap = this.convertQuestionsToScoreMap(questions);

        const totalItems = rawArgs.total;

        const meanScoreByQuestion = mapValues(rawArgs.sumScoreByQuestion, (score) => score / totalItems);

        const arrayOfRatings = map(
            meanScoreByQuestion,
            curry(this.scoreByQuestionItemToMeanValueAndWeight)(questionsToScoreMap)
        );

        const filteredRatings = arrayOfRatings.filter( (n) => n.value !== null );

        const scaledSum = AbstractRatingService.linearScale(
            sum(map(filteredRatings, (v) => v.value)),
            sum(map(filteredRatings, (v) => v.weight)),
            100 * filteredRatings.length
        );

        return scaledSum / filteredRatings.length;
    }

    private scoreByQuestionItemToMeanValueAndWeight(questionToScoreMap, meanVal, questionId) {
        const weight = questionToScoreMap[questionId].weight || 100;
        const maxScore = max( questionToScoreMap[questionId].score );

        return {
            value: !isNaN( meanVal ) ? AbstractRatingService.adjustMeanValueUsingWeight(meanVal, maxScore, weight) : null,
            weight: weight || 100
        };
    }

    private static adjustMeanValueUsingWeight(meanValue, maxScore, weight) {
        return meanValue / (maxScore  / ( weight || 100 ) );
    }

    private convertAnswersToScoreByQuestionsMap(answers: Answer[], questionsToScoreMap) {
        return reduce(
            answers,
            curry(this.extractScoreByQuestionItem)(questionsToScoreMap),
            {}
        );
    }

    private extractScoreByQuestionItem(questionsToScoreMap, scoreByQuestionMap, answer: Answer) {
        const score = questionsToScoreMap[answer.questionId].score[answer.answer];
        const scoreArray = AbstractRatingService.addToExistingArrayOrCreateNew(scoreByQuestionMap[answer.questionId], score);
        const scoreByQuestionItem = {
            [answer.questionId]: scoreArray
        };

        return assign(scoreByQuestionMap, scoreByQuestionItem);
    }

    private static addToExistingArrayOrCreateNew(array, value) {
        return array ? [...array, value] : [value];
    }

    private static linearScale( input: number, fromMax: number, toMax: number ): number {
        return toMax * ( input / fromMax);
    }

    private convertQuestionsToScoreMap(questions: Question[]) {
        return reduce(
            questions,
            this.extractScoreAndWeightFromQuestion,
            {}
        );
    }

    private extractScoreAndWeightFromQuestion(scoreAndWeightMap, question) {
        const id = question._id;
        const scoreAndWeight = {
            score: map(question.options, 'points'),
            weight: question.weight
        };

        return set(scoreAndWeightMap, id, scoreAndWeight);
    }

    private isFinalAnswer(answers: Answer[], questions: Question[]) {
        return (questions.length - answers.length) === 1;
    }

    private isTestInProgress(submittedAnswer: T, answers: Answer[], questions: Question[]) {
        const answer: Answer = find(answers, {'questionId': submittedAnswer.questionId});

        return answer || (( answers.length > 0 ) && ( answers.length < ( questions.length - 1 ) ));
    }

    private isTestStarted(answers: Answer[]) {
        return answers.length === 0;
    }

    private isItAttemptToRetakeTest(answers: Answer[], questions: Question[]) {
        return answers.length >= questions.length;
    }

    private isInvalidAnswer(submittedAnswer: T, questions: Question[]) {
        const question: Question = find(questions, {'_id': submittedAnswer.questionId});

        return !( question && (submittedAnswer.answer < question.options.length) );
    }

    private buildAnswerAcceptedResult(): AnswerProcessingResult {
        return {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'ANSWER_ACCEPTED'
        };
    }

    private buildTestCompletedResult(newMeanRating: Ratings, newUsersRating: Ratings): AnswerProcessingResult {
        return {
            newMeanRating: newMeanRating,
            newUsersRating: newUsersRating,
            result: 'TEST_COMPLETED'
        };
    }

    private buildTestStartedResult(): AnswerProcessingResult {
        return {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'TEST_STARTED'
        };
    }

    private buildAttemptToRetakeTestResult(): AnswerProcessingResult {
        return {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'ATTEMPT_TO_RETAKE_TEST'
        };
    }

    private buildInvalidAnswerResult(): AnswerProcessingResult {
        return {
            newMeanRating: '?',
            newUsersRating: '?',
            result: 'INVALID_ANSWER'
        };
    }
}
