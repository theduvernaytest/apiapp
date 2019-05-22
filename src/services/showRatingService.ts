import {provideSingleton} from '../inversify/ioc';
import {AbstractRatingService} from './abstractRatingService';
import {Answer, Rating, RawCalculationArguments, ShowAnswerSubmit} from '../models/answer';
import {MongoService, Ratings} from './mongoService';
import {inject} from 'inversify';


@provideSingleton(ShowRatingService)
export class ShowRatingService extends AbstractRatingService<ShowAnswerSubmit> {
    constructor(
        @inject(MongoService) protected mongoService: MongoService
    ) {
        super(mongoService);
    }

    protected getAllRatings(submittedAnswer: ShowAnswerSubmit) {
        return this.mongoService.getAllRatingsForShow(submittedAnswer.showId);
    }

    protected getAnswers(userId: string, submittedAnswer: ShowAnswerSubmit) {
        return this.mongoService.getAnswersForShowForSpecificUser(userId, submittedAnswer.showId);
    }

    protected updateRating(answers: Answer[], submittedAnswer: ShowAnswerSubmit, userId: string, userShortName: string) {
        const rating: Rating = {
            answers: answers,
            review: '',
            subjectId: `s${submittedAnswer.showId}`,
            userId: userId,
            userName: userShortName
        };

        return this.mongoService.createOrUpdateRating(rating);
    }

    protected finalizeRating(
                answers: Answer[],
                rawArgs: RawCalculationArguments,
                usersRating: Ratings,
                submittedAnswer: ShowAnswerSubmit,
                userId: string,
                userShortName: string) {

        const rating: Rating = {
            answers: answers,
            rawArgs: rawArgs,
            review: '',
            subjectId: `s${submittedAnswer.showId}`,
            userId: userId,
            userName: userShortName,
            usersRating: usersRating
        };

        return this.mongoService.createOrUpdateRating(rating);
    }
}
