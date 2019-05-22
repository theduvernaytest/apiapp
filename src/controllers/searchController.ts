import {Get, Query, Route} from 'tsoa';
import {provideSingleton} from '../inversify/ioc';
import {TMDbService} from '../services/TMDbService';
import {inject} from 'inversify';
import {SearchResult} from '../models/search';

@Route('Search')
@provideSingleton(SearchController)
export class SearchController {
    constructor(@inject(TMDbService) private tmdbService: TMDbService) {}

    /** Search by movies, tv shows, persons and news */
    @Get('{query}')
    public async Get(query: string, @Query() page = 1): Promise<SearchResult> {
        return this.tmdbService.getSearchResults(query, page);
    }
}
