import {Body, Get, Post, Query, Route, Security} from 'tsoa';
import {Cast, Movie, Movies} from '../models/movie';
import {inject, provideSingleton} from '../inversify/ioc';
import {TMDbService} from '../services/TMDbService';
import {MongoService} from '../services/mongoService';

@Route('Movies')
@provideSingleton(MoviesController)
export class MoviesController {
    constructor(
        @inject(TMDbService) private tmdbService: TMDbService,
        @inject(MongoService) private mongoService: MongoService
    ) { }

    @Get('Playing')
    public async getMoviesList(@Query() page = 1): Promise<Movies[]> {
        return this.tmdbService.getPlayingMoviesList(page);
    }

    @Get('Rated')
    public async getLatestRatedMoviesList(@Query() page = 1): Promise<Movies[]> {
        return this.tmdbService.getLatestRatedMoviesList(page);
    }

    @Get('HighestRated')
    public async getHighestRatedMoviesList(@Query() page = 1): Promise<Movies[]> {
        return this.tmdbService.getHighestRatedMoviesList(page);
    }

    @Get('LowestRated')
    public async getLowestRatedMoviesList(@Query() page = 1): Promise<Movies[]> {
        return this.tmdbService.getLowestRatedMoviesList(page);
    }

    @Get('{movieId}')
    public async getMovieDetails(movieId: number): Promise<Movie> {
        return this.tmdbService.getMovie(movieId);
    }

    @Security('jwt', ['Admin'])
    @Post('{movieId}/Cast/')
    public async setMovieCast(@Body() cast: Cast[], movieId: number) {
        return this.mongoService.getAdditionalMovieInfoByMovieId(movieId).then((data) => {
            if (!data) {
                data = {
                    globalMovieId: movieId,
                    ratedCounter: 0,
                    rating: null,
                    reviewsCounter: 0
                };
            }

            this.mongoService.createOrUpdateMovieInfo({...data, cast}, 0, 0);
        });
    }
}

