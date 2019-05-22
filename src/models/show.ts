import {Cast, Crew, Genre, Studio} from './movie';
import {ImageItem} from '../services/TMDbService';

export interface Shows {
    id: number;
    rating: string;
    name: string;
    backdrop_image: ImageItem[];
    poster_image: ImageItem[];
}

export interface Show {
    backdrop_image: ImageItem[] | null;
    cast: Cast[];
    crew: Crew[];
    first_air_date: string;
    genres: Genre[];
    id: number;
    name: string;
    overview: string;
    production_companies: Studio[];
    poster_image: ImageItem[] | null;
    rating: string;
    ratings_counter: number;
    reviews_counter: number;
}
