import {provideSingleton} from '../inversify/ioc';
import {AbstractRatingService} from './abstractRatingService';
import {Answer, MovieAnswerSubmit, Rating, RawCalculationArguments} from '../models/answer';
import {MongoService, Ratings} from './mongoService';
import {inject} from 'inversify';


@provideSingleton(MovieRatingService)
export class MovieRatingService extends AbstractRatingService<MovieAnswerSubmit> {
    constructor(
        @inject(MongoService) protected mongoService: MongoService
    ) {
        super(mongoService);
    }

    protected getAllRatings(submittedAnswer: MovieAnswerSubmit) {
        return this.mongoService.getAllRatingsForMovie(submittedAnswer.movieId);
    }

    protected getAnswers(userId: string, submittedAnswer: MovieAnswerSubmit) {
        return this.mongoService.getAnswersForMovieForSpecificUser(userId, submittedAnswer.movieId);
    }

    protected updateRating(answers: Answer[], submittedAnswer: MovieAnswerSubmit, userId: string, userShortName: string) {
        const rating: Rating = {
            answers: answers,
            review: '',
            subjectId: `m${submittedAnswer.movieId}`,
            userId: userId,
            userName: userShortName
        };

        return this.mongoService.createOrUpdateRating(rating);
    }

    protected finalizeRating(
                answers: Answer[],
                rawArgs: RawCalculationArguments,
                usersRating: Ratings,
                submittedAnswer: MovieAnswerSubmit,
                userId: string,
                userShortName: string) {

        const rating: Rating = {
            answers: answers,
            rawArgs: rawArgs,
            review: '',
            subjectId: `m${submittedAnswer.movieId}`,
            userId: userId,
            userName: userShortName,
            usersRating: usersRating
        };

        return this.mongoService.createOrUpdateRating(rating);
    }
}
