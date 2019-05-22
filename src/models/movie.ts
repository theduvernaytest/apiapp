import {ImageItem} from '../services/TMDbService';

export interface Movies {
    id: number;
    rating: string;
    title: string;
    backdrop_image: ImageItem[];
    poster_image: ImageItem[];
}

export interface Studio {
    id: number;
    name: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface Cast {
    character: string;
    credit_id: string;
    name: string;
    profile_path: ImageItem[];
}

export interface Crew {
    credit_id: string;
    department: string;
    job: string;
    name: string;
    profile_path: ImageItem[];
}

export interface Movie {
    cast: Cast[];
    crew: Crew[];
    genres: Genre[];
    id: number;
    poster_image: ImageItem[];
    backdrop_image: ImageItem[];
    overview: string;
    rating: string;
    ratings_counter: number;
    reviews_counter: number;
    release_date: string;
    revenue: number;
    studios: Studio[];
    title: string;
}
