import {Genre} from './movie';
import {News} from './news';

export interface PersonSearchResult {
    profile_image: string;
    id: number;
    name: string;
}

export interface MovieSearchResult {
    genres: Genre[];
    id: number;
    poster_image: string | null;
    backdrop_image: string | null;
    overview: string;
    rating: string;
    ratings_counter: number;
    release_date: string;
    title: string;
}

export interface ShowSearchResult {
    backdrop_image: string | null;
    first_air_date: string;
    genres: Genre[];
    id: number;
    rating: string;
    ratings_counter: number;
    name: string;
    overview: string;
    poster_image: string | null;
}

export interface SearchResult {
    movies: MovieSearchResult[];
    shows: ShowSearchResult[];
    persons: PersonSearchResult[];
    news: News[];
}
