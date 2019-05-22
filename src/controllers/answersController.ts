import * as express from 'express';
import {inject, provideSingleton} from '../inversify/ioc';
import {Body, Get, Post, Route, Security, Request, Header, Delete} from 'tsoa';
import {
    Answer,
    MovieAnswerSubmit,
    MovieReviewSubmit,
    Rating,
    RatingResponse,
    ShowAnswerSubmit,
    ShowReviewSubmit
} from '../models/answer';
import {genMovieId, genShowId, MongoService} from '../services/mongoService';
import {escape, trim, omit} from 'lodash';
import {ReCaptchaService} from '../services/recaptchaService';
import {MovieRatingService} from '../services/movieRatingService';
import {ShowRatingService} from '../services/showRatingService';

const fullNameToShortName = (fullName: string): string => {
    const splittedName = trim(fullName).split(' ');

    return `${splittedName[0]} ${splittedName[splittedName.length - 1][0]}.`;
};

@Route('Answers')
@provideSingleton(AnswersController)
export class AnswersController {
    constructor(
        @inject(MongoService) private mongoService: MongoService,
        @inject(MovieRatingService) private movieRatingService: MovieRatingService,
        @inject(ShowRatingService) private showRatingService: ShowRatingService,
        @inject(ReCaptchaService) private reCaptchaService: ReCaptchaService
    ) { }

    public readonly ANSWER_ACCEPTED = 'ANSWER_ACCEPTED';
    public readonly ATTEMPT_TO_RETAKE_TEST = 'ATTEMPT_TO_RETAKE_TEST';
    public readonly INVALID_ANSWER = 'INVALID_ANSWER';
    public readonly INVALID_RECAPTCHA = 'INVALID_RECAPTCHA';
    public readonly TEST_COMPLETED = 'TEST_COMPLETED';
    public readonly TEST_STARTED = 'TEST_STARTED';

    private readonly RESPONSE_MAP = {
        [this.ANSWER_ACCEPTED]: () => ({
            globalRating: null,
            message: 'Added answer to rating object',
            status: 'Success',
            usersRating: null
        }),
        [this.ATTEMPT_TO_RETAKE_TEST]: () => ({
            globalRating: null,
            message: 'The test has been answered already, or answer out of range',
            status: 'Error',
            usersRating: null
        }),
        [this.INVALID_ANSWER]: () => ({
            globalRating: null,
            message: 'Invalid answer',
            status: 'Error',
            usersRating: null
        }),
        [this.INVALID_RECAPTCHA]: () => ({
            globalRating: null,
            message: 'Failed to verify reCaptcha',
            status: 'Failed',
            usersRating: null
        }),
        [this.TEST_COMPLETED]: (newRating, usersRating) => ({
            globalRating: newRating,
            message: 'Updated movie info with new rating',
            status: 'Success',
            usersRating: usersRating
        }),
        [this.TEST_STARTED]: () => ({
            globalRating: null,
            message: 'Created new rating object',
            status: 'Success',
            usersRating: null
        })
    };

    @Security('jwt', ['User'])
    @Get('movie/{movieId}')
    public async getAnswersByMovieIdForCurrentUser(@Request() request: express.Request, movieId: number): Promise<Answer[] | null> {
        return this.mongoService.getRatingForMovieByUser(movieId, request.user.sub)
            .then((rating) => rating ? rating.answers : null );
    }

    @Get('movie/{movieId}/ratings')
    public async getAllRatingsForMovie(movieId: number): Promise<Rating[] | null> {
        return this.mongoService.getAllRatingsForMovie(movieId);
    }

    @Security('jwt', ['User'])
    @Get('movie/{movieId}/ratings/currentUser')
    public async getMovieUsersRatingForCurrentUser(@Request() request: express.Request, movieId: number): Promise<Rating | null> {
        return this.mongoService.getRatingForMovieByUser(movieId, request.user.sub);
    }

    @Security('jwt', ['User'])
    @Get('show/{showId}')
    public async getAnswersByShowIdForCurrentUser(@Request() request: express.Request, showId: number): Promise<Answer[] | null> {
        return this.mongoService.getRatingForShowByUser(showId, request.user.sub)
            .then((rating) => rating ? rating.answers : null );
    }

    @Get('show/{showId}/ratings')
    public async getAllRatingsForShow(showId: number): Promise<Rating[] | null> {
        return this.mongoService.getAllRatingsForShow(showId);
    }

    @Security('jwt', ['User'])
    @Get('show/{showId}/ratings/currentUser')
    public async getShowUsersRatingForCurrentUser(@Request() request: express.Request, showId: number): Promise<Rating | null> {
        return this.mongoService.getRatingForShowByUser(showId, request.user.sub);
    }

    @Security('jwt', ['User'])
    @Post('movie')
    public async addAnswerToMovieTest(
        @Request() request: express.Request,
        @Body() requestBody: MovieAnswerSubmit,
        @Header('g-recaptcha-response') recaptchaToken: string
    ): Promise<RatingResponse> {
       const userId = request.user.sub;
       const userShortName = fullNameToShortName(request.user.name);

       const isAnswerFinal = await this.movieRatingService.isAnswerFinal(requestBody, userId);

       if (isAnswerFinal) {
           const isRecaptchaValid = await this.reCaptchaService.verify(recaptchaToken);

           if (!isRecaptchaValid) {
               return this.RESPONSE_MAP[this.INVALID_RECAPTCHA]();
           }
       }

       const result = await this.movieRatingService.processAnswer(requestBody, userId, userShortName);

       if (result.result === this.TEST_COMPLETED) {
           const movieInfo = await this.mongoService.getAdditionalMovieInfoByMovieId(requestBody.movieId);

           if (movieInfo) {
               const updatedMovieInfo = Object.assign({}, movieInfo, { rating: result.newUsersRating });

               this.mongoService.createOrUpdateMovieInfo(omit(updatedMovieInfo, ['ratedCounter', 'reviewsCounter']), 1, 0);
           } else {
               const newMovieInfo = {
                   globalMovieId: requestBody.movieId,
                   rating: result.newUsersRating,
               };

               this.mongoService.createOrUpdateMovieInfo(newMovieInfo, 1, 0);
           }


           return this.RESPONSE_MAP[result.result](result.newMeanRating, result.newUsersRating);
       } else {
           return this.RESPONSE_MAP[result.result]();
       }
    }

    @Security('jwt', ['User'])
    @Post('show')
    public async addAnswerToShowTest(
        @Request() request: express.Request,
        @Body() requestBody: ShowAnswerSubmit,
        @Header('g-recaptcha-response') recaptchaToken: string
    ): Promise<RatingResponse> {
        const userId = request.user.sub;
        const userShortName = fullNameToShortName(request.user.name);

        const isAnswerFinal = await this.showRatingService.isAnswerFinal(requestBody, userId);

        if (isAnswerFinal) {
            const isRecaptchaValid = await this.reCaptchaService.verify(recaptchaToken);

            if (!isRecaptchaValid) {
                return this.RESPONSE_MAP[this.INVALID_RECAPTCHA]();
            }
        }

        const result = await this.showRatingService.processAnswer(requestBody, userId, userShortName);

        if (result.result === this.TEST_COMPLETED) {
            const showInfo = await this.mongoService.getAdditionalShowInfoByShowId(requestBody.showId);

            if (showInfo) {
                const showInfoWithoutAutoUpgradableFields = omit(showInfo, ['ratedCounter', 'reviewsCounter']);

                const updatedShowInfo = Object.assign({}, showInfoWithoutAutoUpgradableFields, { rating: result.newUsersRating });

                this.mongoService.createOrUpdateShowInfo(updatedShowInfo, 1, 0);
            } else {
                const newShowInfo = {
                    globalShowId: requestBody.showId,
                    rating: result.newUsersRating
                };

                this.mongoService.createOrUpdateShowInfo(newShowInfo, 1, 0);
            }

            return this.RESPONSE_MAP[result.result](result.newMeanRating, result.newUsersRating);
        } else {
            return this.RESPONSE_MAP[result.result]();
        }
    }

    @Security('jwt', ['User'])
    @Delete('movie/{movieId}/review')
    public async deleteMovieReview(
        @Request() request: express.Request,
        movieId: number
    ): Promise<Rating> {
        const userId = request.user.sub;

        let rating = await this.mongoService.getRatingForMovieByUser(movieId, userId);
        const additionalMovieInfo = await this.mongoService.getAdditionalMovieInfoByMovieId(movieId);

        if (rating) {
            rating.review = '';
        }

        this.mongoService.createOrUpdateMovieInfo(additionalMovieInfo, 0, -1);
        this.mongoService.createOrUpdateRating(rating);

        return rating;
    }

    @Security('jwt', ['User'])
    @Post('movie/review')
    public async addMovieReview(
        @Request() request: express.Request,
        @Body() r: MovieReviewSubmit,
        @Header('g-recaptcha-response') recaptchaToken: string
    ): Promise<Rating> {
        return Promise.all([
            this.mongoService.getRatingForMovieByUser(r.movieId, request.user.sub),
            this.mongoService.getAdditionalMovieInfoByMovieId(r.movieId),
            this.reCaptchaService.verify(recaptchaToken)
        ]).then(([rating, additionalMovieInfo, isCaptchaVerified]) => {
            if (!r.review || !isCaptchaVerified) {
                return rating;
            }

            if (rating) {
                rating.review = r.review;
            } else {
                rating = {
                    answers: [],
                    review: escape(r.review),
                    subjectId: genMovieId(r.movieId),
                    userId: request.user.sub,
                    userName: fullNameToShortName(request.user.name)
                };
            }

            if (additionalMovieInfo) {
                this.mongoService.createOrUpdateMovieInfo(additionalMovieInfo, 0, 1);
            } else {
                additionalMovieInfo = {
                    globalMovieId: r.movieId,
                    ratedCounter: 0,
                    rating: '?',
                    reviewsCounter: 1
                };
                this.mongoService.createOrUpdateMovieInfo(additionalMovieInfo, 0, 0);
            }

            this.mongoService.createOrUpdateRating(rating);
            return rating;
        });
    }

    @Security('jwt', ['User'])
    @Delete('show/{showId}/review')
    public async deleteShowReview(
        @Request() request: express.Request,
        showId: number
    ): Promise<Rating> {
        const userId = request.user.sub;

        let rating = await this.mongoService.getRatingForShowByUser(showId, userId);
        const additionalShowInfo = await this.mongoService.getAdditionalShowInfoByShowId(showId);

        if (rating) {
            rating.review = '';
        }

        this.mongoService.createOrUpdateShowInfo(additionalShowInfo, 0, -1);
        this.mongoService.createOrUpdateRating(rating);

        return rating;
    }

    @Security('jwt', ['User'])
    @Post('show/review')
    public async addShowReview(
        @Request() request: express.Request,
        @Body() r: ShowReviewSubmit,
        @Header('g-recaptcha-response') recaptchaToken: string
    ): Promise<Rating> {
        return Promise.all([
            this.mongoService.getRatingForShowByUser(r.showId, request.user.sub),
            this.mongoService.getAdditionalShowInfoByShowId(r.showId),
            this.reCaptchaService.verify(recaptchaToken)
        ]).then(([rating, additionalShowInfo, isCaptchaVerified]) => {
            if (!r.review || !isCaptchaVerified) {
                return rating;
            }

            if (rating) {
                rating.review = r.review;
            } else {
                rating = {
                    answers: [],
                    review: escape(r.review),
                    subjectId: genShowId(r.showId),
                    userId: request.user.sub,
                    userName: fullNameToShortName(request.user.name)
                };
            }

            if (additionalShowInfo) {
                this.mongoService.createOrUpdateShowInfo(additionalShowInfo, 0, 1);
            } else {
                additionalShowInfo = {
                    globalShowId: r.showId,
                    ratedCounter: 0,
                    rating: '?',
                    reviewsCounter: 1
                };

                this.mongoService.createOrUpdateShowInfo(additionalShowInfo, 0, 0);
            }
            this.mongoService.createOrUpdateRating(rating);

            return rating;
        });
    }
}
