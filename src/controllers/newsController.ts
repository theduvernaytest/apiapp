import {Body, Delete, Get, Post, Route, Security, Patch} from 'tsoa';
import {provideSingleton} from '../inversify/ioc';
import {inject} from 'inversify';
import {MongoService} from '../services/mongoService';
import {News} from '../models/news';

@Route('News')
@provideSingleton(NewsController)
export class NewsController {
    constructor(@inject(MongoService) private mongoService: MongoService) {}

    /** Get all news */
    @Get('')
    public async Get(): Promise<News[]> {
        return this.mongoService.getAllNews();
    }

    /**
     * Add news
     */
    @Security('jwt', ['Admin'])
    @Post()
    public async Post(@Body() request: News): Promise<News> {
        return this.mongoService.createNews(request);
    }

    /**
     * Delete news
     */
    @Security('jwt', ['Admin'])
    @Delete('{newsId}')
    public async Delete(newsId: string): Promise<void> {
        return this.mongoService.deleteNews(newsId);
    }

    /**
     * Update news
     */
    @Security('jwt', ['Admin'])
    @Patch('{newsId}')
    public async Update(@Body() request: News, newsId: string): Promise<News> {
        return this.mongoService.updateNews(newsId, request);
    }
}
