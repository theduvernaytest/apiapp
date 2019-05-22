import {Ratings} from '../services/mongoService';

export interface Answer {
    questionId: string;
    answer: number;
}

export interface AnswerSubmit {
    questionId: string;
    answer: number;
}

export interface MovieAnswerSubmit extends AnswerSubmit {
    movieId: number;
}

export interface ShowAnswerSubmit extends AnswerSubmit {
    showId: number;
}

export interface MovieReviewSubmit {
    movieId: number;
    review: string;
}

export interface ShowReviewSubmit {
    showId: number;
    review: string;
}

export interface RatingResponse {
    status: string;
    message: string;
    usersRating: Ratings | null;
    globalRating: Ratings | null;
}

export interface RawCalculationArguments {
    sumScoreByQuestion: QuestionToScoreMap;
    total: number;
}

export interface QuestionToScoreMap {
    [key: string]: number;
}

export interface Rating {
    subjectId: string;
    userId: string;
    userName: string;
    answers: Answer[];
    review: string;
    usersRating?: Ratings;
    rawArgs?: RawCalculationArguments;
}

