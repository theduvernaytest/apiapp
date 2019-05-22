import {MongoClient, ObjectID} from 'mongodb';
import {inject, provideSingleton} from '../inversify/ioc';
import {Question, QuestionCreateUpdate} from '../models/question';
import {Answer, Rating} from '../models/answer';
import {News} from '../models/news';
import {ContactUsMessage} from '../models/contactus';
import {Subscribe} from '../models/subscribe';
import {omit, map} from 'lodash';
import {Cast} from '../models/movie';
import {EnvironmentVariablesService} from './environmentVariablesService';

const RATINGS_COLLECTION = 'ratings';
const MOVIES_COLLECTION = 'movies';
const SHOWS_COLLECTION = 'shows';
const QUESTIONS_COLLECTION = 'questions';
const USERS_COLLECTION = 'users';
const NEWS_COLLECTION = 'news';
const CONTACT_US_COLLECTION = 'contactus';
const SUBSCRIBE_COLLECTION = 'subscribe';

const ITEMS_PER_PAGE = 20;

export type Ratings = '?' | 'F' | 'D' | 'C' | 'B' | 'A';

export interface AdditionalMovieInfo {
    globalMovieId: number;
    rating: Ratings;
    ratedCounter?: number;
    reviewsCounter?: number;
    cast?: Cast[];
}

export interface AdditionalShowInfo {
    globalShowId: number;
    rating: Ratings;
    ratedCounter?: number;
    reviewsCounter?: number;
    cast?: Cast[];
}

export type UserRoles = 'Admin' | 'User';

export interface User {
    _id?: ObjectID;
    facebookId: number | null;
    googleId: number | null;
    name: string;
    email: string | null;
    roles: UserRoles[];
}

export const genMovieId = (id) => `m${id}`;
export const genShowId = (id) => `s${id}`;

@provideSingleton(MongoService)
export class MongoService {
    private connection;

    constructor(@inject(EnvironmentVariablesService) envService: EnvironmentVariablesService) {
        this.connection = new Promise((resolve, reject) => {
            MongoClient.connect(envService.getMongoUrl(), {
                poolSize: 10
            }, (err, client) => {
                if (err) {
                    reject(err);
                }
                resolve(client.db('test'));
            });
        });
    }

    public getLatestRatedMovies(page: number): Promise<AdditionalMovieInfo[]> {
        return this.connection.then((db) => {
           return db.collection(MOVIES_COLLECTION)
                   .find({})
                   .sort({ratingUpdateAt: -1})
                   .skip(ITEMS_PER_PAGE * (page - 1))
                   .limit(ITEMS_PER_PAGE)
                   .toArray();
       });
    }

    public getHighestRatedMovies(page: number): Promise<AdditionalMovieInfo[]> {
        return this.connection.then((db) => {
            return db.collection(MOVIES_COLLECTION)
                .find({})
                .sort({rating: 1})
                .skip(ITEMS_PER_PAGE * (page - 1))
                .limit(ITEMS_PER_PAGE)
                .toArray();
        });
    }

    public getLowestRatedMovies(page: number): Promise<AdditionalMovieInfo[]> {
        return this.connection.then((db) => {
            return db.collection(MOVIES_COLLECTION)
                .find({})
                .sort({rating: -1})
                .skip(ITEMS_PER_PAGE * (page - 1))
                .limit(ITEMS_PER_PAGE)
                .toArray();
        });
    }

    public getAdditionalMovieInfoByMovieId(globalMovieId: number): Promise<AdditionalMovieInfo> {
        return this.connection.then((db) => db.collection(MOVIES_COLLECTION).findOne({globalMovieId: globalMovieId}));
    }

    public getAdditionalShowInfoByShowId(globalShowId: number): Promise<AdditionalShowInfo> {
        return this.connection.then((db) => db.collection(SHOWS_COLLECTION).findOne({globalShowId: globalShowId}));
    }

    public createOrUpdateMovieInfo(
        movie: AdditionalMovieInfo,
        increaseRatedCounterOn: number,
        increaseReviewCounterOn: number
    ): Promise<AdditionalMovieInfo> {
        return this.connection.then((db) =>
            db.collection(MOVIES_COLLECTION).updateOne(
                { globalMovieId: movie.globalMovieId },
                {
                    $currentDate: {
                        ratingUpdateAt: true
                    },
                    $inc: {
                        ratedCounter: increaseRatedCounterOn,
                        reviewsCounter: increaseReviewCounterOn
                    },
                    $set: omit(movie, ['ratedCounter', 'reviewsCounter', 'ratingUpdateAt'])
                },
                { upsert: true }
            )
        );
    }

    public getLatestRatedShows(page: number): Promise<AdditionalShowInfo[]> {
        return this.connection.then((db) => {
            return db.collection(SHOWS_COLLECTION)
                .find({})
                .sort({ratingUpdateAt: -1})
                .skip(ITEMS_PER_PAGE * (page - 1))
                .limit(ITEMS_PER_PAGE)
                .toArray();
        });
    }

    public getHighestRatedShows(page: number): Promise<AdditionalShowInfo[]> {
        return this.connection.then((db) => {
            return db.collection(SHOWS_COLLECTION)
                .find({})
                .sort({rating: 1})
                .skip(ITEMS_PER_PAGE * (page - 1))
                .limit(ITEMS_PER_PAGE)
                .toArray();
        });
    }

    public getLowestRatedShows(page: number): Promise<AdditionalShowInfo[]> {
        return this.connection.then((db) => {
           return db.collection(SHOWS_COLLECTION)
                .find({})
                .sort({rating: -1})
                .skip(ITEMS_PER_PAGE * (page - 1))
                .limit(ITEMS_PER_PAGE)
                .toArray();
        });
    }

    public createOrUpdateShowInfo(
        show: AdditionalShowInfo,
        increaseRatedCounterOn: number,
        increaseReviewCounterOn: number
    ): Promise<AdditionalShowInfo> {
        return this.connection.then((db) =>
            db.collection(SHOWS_COLLECTION).updateOne(
                { globalShowId: show.globalShowId },
                {
                    $currentDate: {
                        ratingUpdateAt: true
                    },
                    $inc: {
                        ratedCounter: increaseRatedCounterOn,
                        reviewsCounter: increaseReviewCounterOn
                    },
                    $set: omit(show, ['ratedCounter', 'reviewsCounter', 'ratingUpdateAt'])
                },
                { upsert: true }
            )
        );
    }

    public createOrUpdateRating(rating: Rating): Promise<object> {
        return this.connection.then((db) => {
           return db.collection(RATINGS_COLLECTION)
           .updateOne(
               { subjectId: rating.subjectId, userId: rating.userId },
               { $set: rating },
               { upsert: true }
            );
        });
    }

    public getAllRatingsForMovie(globalMovieId: number): Promise<Rating[]> {
        return this.connection.then((db) => {
           return db.collection(RATINGS_COLLECTION)
               .find({
                   subjectId: genMovieId(globalMovieId),
                   usersRating: { $exists: true }
               })
               .sort( { 'rawArgs.total': -1 } )
               .limit(50)
               .toArray();
        });
    }

    public getAllRatingsForShow(globalShowId: number): Promise<Rating[]> {
        return this.connection.then((db) => {
            return db.collection(RATINGS_COLLECTION)
                .find({
                    subjectId: genShowId(globalShowId),
                    usersRating: { $exists: true }
                })
                .sort( { 'rawArgs.total': -1 } )
                .limit(50)
                .toArray();
        });
    }

    public getRatingForMovieByUser(globalMovieId: number, userId: string): Promise<Rating> {
        return this.connection.then((db) => {
            return db.collection(RATINGS_COLLECTION).findOne({subjectId: genMovieId(globalMovieId), userId: userId});
        });
    }

    public getRatingForShowByUser(globalShowId: number, userId: string): Promise<Rating> {
        return this.connection.then((db) => {
           return db.collection(RATINGS_COLLECTION).findOne({subjectId: genShowId(globalShowId), userId: userId});
        });
    }

    // TODO take care about returned value, currently it returns mongo's response which is not right
    public updateQuestion(id: string, q: QuestionCreateUpdate): Promise<Question> {
        return this.connection.then((db) =>
            db.collection(QUESTIONS_COLLECTION).updateOne(
                { '_id': new ObjectID(id) },
                { $set: omit(q, '_id') }
            )
        );
    }

    public createQuestion(q: QuestionCreateUpdate): Promise<Question> {
        return this.connection.then((db) =>
            db.collection(QUESTIONS_COLLECTION).insertOne(q));
    }

    public async getAllQuestions(): Promise<Question[]> {
        const db = await this.connection;

        const questions = await db.collection(QUESTIONS_COLLECTION).find().toArray();

        return this.castMongoIdToStringForArray(questions);
    }

    private castMongoIdToStringForArray(objects: Array<Object>) {
        return map(objects, this.caseMongoIdToString);
    }

    private caseMongoIdToString(object: Object): Object {
        return Object.assign({}, object, {'_id': object['_id'] && object['_id'].toString()});
    }

    public getQuestionById(questionId: string): Promise<Question> {
        return this.connection.then((db) => {
           return db.collection(QUESTIONS_COLLECTION).findOne({'_id': new ObjectID(questionId)});
        });
    }

    public deleteQuestion(questionId: string): Promise<void> {
        return this.connection.then((db) => {
           return db.collection(QUESTIONS_COLLECTION).removeOne({'_id': new ObjectID(questionId)});
        });
    }

    public getUserByFacebookId(facebookId: number): Promise<User> {
        return this.connection.then((db) => {
           return db.collection(USERS_COLLECTION).findOne({facebookId: facebookId});
        });
    }

    public getUserByGoogleId(googleId: number): Promise<User> {
        return this.connection.then((db) => {
           return db.collection(USERS_COLLECTION).findOne({googleId: googleId});
        });
    }

    public createUser(user: User) {
        return this.connection.then((db) => {
           return db.collection(USERS_COLLECTION).insertOne(user);
        });
    }

    public getAllNews(): News[] {
        return this.connection.then((db) => {
           return db.collection(NEWS_COLLECTION).find().sort({'date': -1}).toArray();
        });
    }

    public createNews(news: News) {
        return this.connection.then((db) => {
           return db.collection(NEWS_COLLECTION).insertOne(news);
        });
    }

    public deleteNews(newsId: string) {
        return this.connection.then((db) => {
           return db.collection(NEWS_COLLECTION).removeOne({'_id': new ObjectID(newsId)});
        });
    }

    public updateNews(newsId: string, newData: News) {
        return this.connection.then((db) => {
           return db.collection(NEWS_COLLECTION).updateOne(
           { '_id': new ObjectID(newsId) },
           { $set: omit(newData, '_id') }
       );
        });
    }

    public searchNews(query: string, page: number): Promise<News[]> {
        return this.connection.then((db) => {
        const textIndex = {
            description: 'text',
            title: 'text'
        };
            return db.ensureIndex(NEWS_COLLECTION, textIndex).then(() => {
                return db.collection(NEWS_COLLECTION).find( { $text: { $search: query } } )
                        .skip(ITEMS_PER_PAGE * (page - 1))
                        .limit(ITEMS_PER_PAGE)
                        .toArray();
        });
        });
    }

    public getContactUsMessages(): Promise<ContactUsMessage[]> {
        return this.connection.then((db) => {
            return db.collection(CONTACT_US_COLLECTION).find().toArray();
        });
    }

    public createContactUsMessage(message: ContactUsMessage): Promise<ContactUsMessage> {
        return this.connection.then((db) => {
            return db.collection(CONTACT_US_COLLECTION).insertOne(message);
        });
    }

    public getSubscribers(): Promise<Subscribe[]> {
        return this.connection.then((db) => {
            return db.collection(SUBSCRIBE_COLLECTION).find().toArray();
        });
    }

    public createSubscriber(subscriber: Subscribe): Promise<Subscribe> {
        return this.connection.then((db) => {
            return db.collection(SUBSCRIBE_COLLECTION).insertOne(subscriber);
        });
    }

    public getAnswersForMovieForSpecificUser(userId: string, movieId: number): Answer[] {
        return this.connection.then((db) => {
            return db.collection(RATINGS_COLLECTION).findOne({
                subjectId: 'm' + movieId,
                userId: userId
            }).then( (document) => {
                return document ? document.answers : [];
            });
        });
    }

    public getAnswersForShowForSpecificUser(userId: string, showId: number): Answer[] {
        return this.connection.then((db) => {
            return db.collection(RATINGS_COLLECTION).findOne({
                subjectId: 's' + showId,
                userId: userId
            }).then( (document) => {
                return document ? document.answers : [];
            });
        });
    }
}
