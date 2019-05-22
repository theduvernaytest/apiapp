import {Genre, Movie, Movies} from '../models/movie';
import { map, pick, update, find, isArray, isEmpty, concat, extend, sortBy } from 'lodash';
import {EnvironmentVariablesService} from './environmentVariablesService';
import {inject, provideSingleton} from '../inversify/ioc';
import {RedisService, CacheStatus} from './redisService';
import fetch from 'node-fetch';
import {MongoService} from './mongoService';
import {Show, Shows} from '../models/show';
import {MovieSearchResult, SearchResult, ShowSearchResult} from '../models/search';
import { Logger, transports } from 'winston';

const REGION = 'US';
export const API = 'https://api.themoviedb.org/3/';

const PLAYING_MOVIES_CACHE_KEY = 'playing_movies';
const MOVIE_CACHE_KEY = 'movie';

const PLAYING_SHOWS_CACHE_KEY = 'playing_shows';
const SHOW_CACHE_KEY = 'show';

const SEARCH_CACHE_KEY = 'search';

const CONFIG_CACHE_KEY = 'config';
const MOVIE_GENRES_CACHE_KEY = 'movie_genres';
const SHOW_GENRES_CACHE_KEY = 'show_genres';

export const FETCH_OPTIONS = {
    timeout: 8000
};

export interface Config {
    images: {
        base_url: string;
        secure_base_url: string;
        backdrop_sizes: Array<string>;
        logo_sizes: Array<string>;
        poster_sizes: Array<string>;
        profile_sizes: Array<string>;
        still_sizes: Array<string>;
    };
    change_keys: Array<string>;
}

export interface ImageItem {
    res: string;
    path: string;
}

type ImageTypes = 'backdrop' | 'logo' | 'poster' | 'profile' | 'still';

type FetchParams = {
    [key: string]: any
};

type GenresResponse = {
    genres: Genre[];
};

type MoviesResponse = {
    results: Movies[];
};

type ShowsResponse = {
    results: Show[];
};

@provideSingleton(TMDbService)
export class TMDbService {
    config: Promise<Config>;
    movieGenres: Promise<Genre[]>;
    showGenres: Promise<Genre[]>;

    private theMovieDBKey;
    private logger;

    private static jsonOrException(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }

    private fetchWithCache<T>(apiUrl: string, cacheKey: string, params?: FetchParams): Promise<T> {
        return this.redisService.getDataFromCache<T>(cacheKey).then((cache) => {
            if (cache.status === CacheStatus.VALID) {
                return cache.data;
            } else {
                const allParams = extend({
                    'api_key': this.theMovieDBKey
                }, params);

                const allParamsMap = map(allParams, (v, k) => `${k}=${v}`);
                const paramsString = allParamsMap.join('&');

                return fetch(`${API}${apiUrl}?${paramsString}`, FETCH_OPTIONS)
                    .then(TMDbService.jsonOrException)
                    .then((data) => {
                        if (!isEmpty(data)) {
                            this.redisService.putDataToCache(cacheKey, data);
                        } else {
                            this.logger.error(`The data is empty for url: ${apiUrl}`);
                        }
                        return data;
                    })
                    .catch((exception) => {
                        this.logger.error(exception);
                        if (cache.status === CacheStatus.EXPIRED) {
                            return cache.data;
                        } else {
                            return exception;
                        }
                    });
            }
        });
    }

    constructor(
        @inject(EnvironmentVariablesService) private envService: EnvironmentVariablesService,
        @inject(RedisService) private redisService: RedisService,
        @inject(MongoService) private mongoService: MongoService
    ) {
        this.logger = new Logger({
            transports: [
                new transports.Console()
            ]
        });

        this.theMovieDBKey = this.envService.getTheMovieDBKey();

        this.config = this.fetchWithCache<Config>('configuration', CONFIG_CACHE_KEY);

        this.movieGenres = this.fetchWithCache<GenresResponse>('genre/movie/list', MOVIE_GENRES_CACHE_KEY)
                            .then((data) => data.genres);

        this.showGenres = this.fetchWithCache<GenresResponse>('genre/tv/list', SHOW_GENRES_CACHE_KEY)
                            .then((data) => data.genres);
    }

    private static getImageUrls(config: Config, type: ImageTypes, path: string): {res: string, path: string} {
        const ORIGINAL_IMAGE_MARKER = 'original';

        return sortBy(
            map(
                config.images[`${type}_sizes`],
                (v) => {
                    return {
                        path: `${config.images.secure_base_url}${v}${path}`,
                        res: v === ORIGINAL_IMAGE_MARKER ? v : v.substr(1) + v.substr(0, 1)
                    };
                }
            ),
            (o) => o.res !== ORIGINAL_IMAGE_MARKER
        );
    }

    public getPlayingMoviesList(page = 1): Promise<Movies[]> {
        return this.fetchWithCache<MoviesResponse>(
            `movie/now_playing`,
            `${PLAYING_MOVIES_CACHE_KEY}:${page}`,
            {'region': REGION, 'page': page}
            )
                    .then((json) => json.results)
                    .then((data) => {
                        return map(data, (o) => {
                            return Promise.all([this.mongoService.getAdditionalMovieInfoByMovieId(o.id), this.config])
                                .then(([r, c]) => {
                                    return {
                                        backdrop_image: o.backdrop_path ? TMDbService.getImageUrls(c, 'backdrop', o.backdrop_path) : '',
                                        id: o.id,
                                        poster_image: o.poster_path ? TMDbService.getImageUrls(c, 'poster', o.poster_path) : '',
                                        rating: r && r.rating ? r.rating : '?',
                                        title: o.title
                                    };
                                });
                        });
                    }).then((data) => Promise.all<any>(data));
    }

    public getLatestRatedMoviesList(page = 1): Promise<Movies[]> {
        return this.mongoService.getLatestRatedMovies(page).then((movies) => {
            return isArray(movies) ? movies.map((v) => {
                return this.getMovie(v.globalMovieId).then((m) => {
                   return pick(m, ['id', 'rating', 'title', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        })
        .then((data) => Promise.all(data));
    }

    public getHighestRatedMoviesList(page = 1): Promise<Movies[]> {
        return this.mongoService.getHighestRatedMovies(page).then((movies) => {
            return isArray(movies) ? movies.map((v) => {
                return this.getMovie(v.globalMovieId).then((m) => {
                    return pick(m, ['id', 'rating', 'title', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        }).then((data) => Promise.all(data));
    }

    public getLowestRatedMoviesList(page = 1): Promise<Movies[]> {
        return this.mongoService.getLowestRatedMovies(page).then((movies) => {
            return isArray(movies) ? movies.map((v) => {
                return this.getMovie(v.globalMovieId).then((m) => {
                    return pick(m, ['id', 'rating', 'title', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        }).then((data) => Promise.all(data));
    }

    public getMovie(movieId: number): Promise<Movie> {
        return Promise.all(
            [
                this.fetchWithCache<any>(`movie/${movieId}/credits`, `${MOVIE_CACHE_KEY}:${movieId}:credits`),
                this.fetchWithCache<any>(`movie/${movieId}`, `${MOVIE_CACHE_KEY}:${movieId}`, { 'region': REGION }),
                this.mongoService.getAdditionalMovieInfoByMovieId(movieId),
                this.config
            ]
        ).then(([credits, movie, info, conf]) => {
            const imgProfileUrl = (p) => TMDbService.getImageUrls(conf, 'profile', p);
            const imgPosterUrl = (p) => TMDbService.getImageUrls(conf, 'poster', p);
            const imgBackdropUrl = (p) => TMDbService.getImageUrls(conf, 'backdrop', p);

            const castFields = ['character', 'credit_id', 'name', 'profile_path'];
            const crewFields = ['credit_id', 'department', 'job', 'name', 'profile_path'];

            return {...{
                backdrop_image: movie.backdrop_path ? imgBackdropUrl(movie.backdrop_path) : [''],
                cast: map(sortBy(credits.cast, 'order'), (o) => pick(update(o, 'profile_path', (v) => v ? imgProfileUrl(v) : ['']), castFields)),
                crew: map(sortBy(credits.crew, 'order'), (o) => pick(update(o, 'profile_path', (v) => v ? imgProfileUrl(v) : ['']), crewFields)),
                genres: movie.genres,
                id: movie.id,
                overview: movie.overview,
                poster_image: movie.poster_path ? imgPosterUrl(movie.poster_path) : [''],
                rating: info && info.rating ? info.rating : '?',
                ratings_counter: info && info.ratedCounter ? info.ratedCounter : 0,
                release_date: movie.release_date,
                revenue: movie.revenue,
                reviews_counter: info && info.reviewsCounter ? info.reviewsCounter : 0,
                studios: movie.production_companies,
                title: movie.title
            }, ...pick(info, ['cast', 'crew'])};
        });
    }

    public getPlayingShowsList(page = 1): Promise<Shows[]> {
        return this.fetchWithCache<ShowsResponse>(
            'tv/on_the_air',
            `${PLAYING_SHOWS_CACHE_KEY}:${page}`,
            {page}
        ).then((json) => {
                return map(json.results, (o) => {
                    return Promise.all([this.mongoService.getAdditionalShowInfoByShowId(o.id), this.config])
                        .then(([r, c]) => {
                            return {
                                backdrop_image: o.backdrop_path ? TMDbService.getImageUrls(c, 'backdrop', o.backdrop_path) : '',
                                id: o.id,
                                name: o.name,
                                poster_image: o.poster_path ? TMDbService.getImageUrls(c, 'poster', o.poster_path) : '',
                                rating: r && r.rating ? r.rating : '?'
                            };
                        });
                });
            }).then((data) => Promise.all<any>(data));
    }

    public getLatestRatedShowsList(page = 1): Promise<Shows[]> {
        return this.mongoService.getLatestRatedShows(page).then((shows) => {
            return isArray(shows) ? shows.map((v) => {
                return this.getShow(v.globalShowId).then((s) => {
                    return pick(s, ['id', 'rating', 'name', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        }).then((data) => Promise.all(data));
    }

    public getHighestRatedShowsList(page = 1): Promise<Shows[]> {
        return this.mongoService.getHighestRatedShows(page).then((shows) => {
            return isArray(shows) ? shows.map((v) => {
                return this.getShow(v.globalShowId).then((s) => {
                    return pick(s, ['id', 'rating', 'name', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        }).then((data) => Promise.all(data));
    }

    public getLowestRatedShowsList(page = 1): Promise<Shows[]> {
        return this.mongoService.getLowestRatedShows(page).then((shows) => {
            return isArray(shows) ? shows.map((v) => {
                return this.getShow(v.globalShowId).then((s) => {
                    return pick(s, ['id', 'rating', 'name', 'backdrop_image', 'poster_image']);
                });
            }) : [];
        }).then((data) => Promise.all(data));
    }

    public getShow(showId): Promise<Show> {
        return Promise.all([
            this.fetchWithCache<any>(
                `tv/${showId}/credits`,
                `${SHOW_CACHE_KEY}:${showId}:credits`
            ),
            this.fetchWithCache<any>(
                `tv/${showId}`,
                `${SHOW_CACHE_KEY}:${showId}`
            ),
            this.mongoService.getAdditionalShowInfoByShowId(showId),
            this.config
        ]).then(([credits, show, info, conf]) => {
            const getProfileImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'profile', path) : [''];
            const getPosterImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'poster', path) : [''];
            const getBackdropImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'backdrop', path) : [''];

            const castFields = ['character', 'credit_id', 'name', 'profile_path'];
            const crewFields = ['credit_id', 'department', 'job', 'name', 'profile_path'];

            return {...{
              backdrop_image: getBackdropImgUrl(show.backdrop_path),
              cast: map(
                  sortBy(credits.cast, 'order'),
                  (o) => pick(
                      update(o, 'profile_path', (v) => getProfileImgUrl(v)),
                      castFields
                  )
              ),
              crew: concat(
                  map(sortBy(credits.crew, 'order'), (o) => pick(
                        update(o, 'profile_path', (v) => getProfileImgUrl(v)),
                        crewFields
                      )
                  ),
                  map(show.created_by, (o) => pick(
                        update(o, 'profile_path', (v) => getProfileImgUrl(v)),
                        ['name', 'profile_path', 'id']
                      )
                  )
              ),
              first_air_date: show.first_air_date,
              genres: show.genres,
              id: show.id,
              name: show.name,
              overview: show.overview,
              poster_image: getPosterImgUrl(show.poster_path),
              production_companies: show.production_companies,
              rating: info && info.rating ? info.rating : '?',
              ratings_counter: info && info.ratedCounter ? info.ratedCounter : 0,
              reviews_counter: info && info.reviewsCounter ? info.reviewsCounter : 0
            }, ...pick(info, ['cast', 'crew'])};
        });
    }

    public getSearchResults(query: string, page: number): Promise<SearchResult> {
        return Promise.all([
            this.fetchWithCache<any>(
                `search/movie`,
                `${SEARCH_CACHE_KEY}:${query}:movies:${page}`,
                { 'query': query, page }
            ),
            this.fetchWithCache<any>(
                `search/tv`,
                `${SEARCH_CACHE_KEY}:${query}:tv:${page}`,
                { 'query': query, page }
            ),
            this.fetchWithCache<any>(
                `search/person`,
                `${SEARCH_CACHE_KEY}:${query}:person:${page}`,
                { 'query': query, page }
            ),
            this.mongoService.searchNews(query, page),
            this.config,
            this.showGenres,
            this.movieGenres
        ]).then(([movies, shows, persons, newsSearchResults, conf, showGenres, movieGenres]) => {
            const getProfileImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'profile', path) : [''];
            const getPosterImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'poster', path) : [''];
            const getBackdropImgUrl =
                (path) =>
                    path ? TMDbService.getImageUrls(conf, 'backdrop', path) : [''];

            const getMovieSearchResults =
                (m) => isArray(m) ? m.map((i) => {
                    return this.mongoService.getAdditionalMovieInfoByMovieId(i.id).then((info) => {
                        return {
                            backdrop_image: getBackdropImgUrl(i.backdrop_path),
                            genres: i.genre_ids.map((v) => find(movieGenres, {id: v})),
                            id: i.id,
                            overview: i.overview,
                            poster_image: getPosterImgUrl(i.poster_path),
                            rating: info && info.rating ? info.rating : '?',
                            ratings_counter: info && info.ratedCounter ? info.ratedCounter : 0,
                            release_date: i.release_date,
                            title: i.title
                        };
                    });
                }) : [];
            const getShowsSearchResults =
                (s) => isArray(s) ? s.map((i) => {
                    return this.mongoService.getAdditionalShowInfoByShowId(i.id).then((info) => {
                        return {
                            backdrop_image: getBackdropImgUrl(i.backdrop_path),
                            first_air_date: i.first_air_date,
                            genres: i.genre_ids.map((v) => find(showGenres, {id: v})),
                            id: i.id,
                            name: i.name,
                            overview: i.overview,
                            poster_image: getPosterImgUrl(i.poster_path),
                            rating: info && info.rating ? info.rating : '?',
                            ratings_counter: info && info.ratedCounter ? info.ratedCounter : 0,
                        };
                    });
                }) : [];
            const getPersonsSearchResults =
                (p) => isArray(p) ? p.map((i) => ({
                    id: i.id,
                    name: i.name,
                    profile_image: getProfileImgUrl(i.profile_path)
                })) : [];

            const promiseAll: [Promise<MovieSearchResult[]>, Promise<ShowSearchResult[]>] = [
                Promise.all<any>(getMovieSearchResults(movies.results)),
                Promise.all<any>(getShowsSearchResults(shows.results))
            ];

            return Promise.all<any>(promiseAll).then(([movieResolved, showsResolved]) => {
                return {
                    movies: movieResolved,
                    news: newsSearchResults,
                    persons: getPersonsSearchResults(persons.results),
                    shows: showsResolved
                };
            });
        });
    }
}
