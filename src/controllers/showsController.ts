import {Body, Get, Post, Query, Route, Security} from 'tsoa';
import {provideSingleton} from '../inversify/ioc';
import {inject} from 'inversify';
import {Show, Shows} from '../models/show';
import {TMDbService} from '../services/TMDbService';
import {Cast} from '../models/movie';
import {MongoService} from '../services/mongoService';

@Route('Shows')
@provideSingleton(ShowsController)
export class ShowsController {
    constructor(
        @inject(TMDbService) private tmdbService: TMDbService,
        @inject(MongoService) private mongoService: MongoService
    ) { }

    @Get('Playing')
    public async getNowPLayingShowsList(@Query() page = 1): Promise<Shows[]> {
        return this.tmdbService.getPlayingShowsList(page);
    }

    @Get('Rated')
    public async getLatestRatedShowsList(@Query() page = 1): Promise<Shows[]> {
        return this.tmdbService.getLatestRatedShowsList(page);
    }

    @Get('HighestRated')
    public async getHighestRatedShowsList(@Query() page = 1): Promise<Shows[]> {
        return this.tmdbService.getHighestRatedShowsList(page);
    }

    @Get('LowestRated')
    public async getLowestRatedShowsList(@Query() page = 1): Promise<Shows[]> {
        return this.tmdbService.getLowestRatedShowsList(page);
    }

    @Get('{showId}')
    public async getShowDetails(showId: number): Promise<Show> {
        return this.tmdbService.getShow(showId);
    }

    @Security('jwt', ['Admin'])
    @Post('{showId}/Cast/')
    public async setShowCast(@Body() cast: Cast[], showId: number) {
        return this.mongoService.getAdditionalShowInfoByShowId(showId).then((data) => {
            if (!data) {
                data = {
                    globalShowId: showId,
                    ratedCounter: 0,
                    rating: null,
                    reviewsCounter: 0
                };
            }

            this.mongoService.createOrUpdateShowInfo({...data, cast}, 0, 0);
        });
    }
}
