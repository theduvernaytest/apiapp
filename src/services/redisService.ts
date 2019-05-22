import {provideSingleton} from '../inversify/ioc';
import * as redis from 'redis';
import * as bluebird from 'bluebird';

export enum CacheStatus {
    MISSING,
    EXPIRED,
    VALID
}

interface Cache<T> {
    readonly status: CacheStatus;
    readonly data: T;
}

@provideSingleton(RedisService)
export class RedisService {
    private client;

    constructor() {
        this.client = redis.createClient(6379 , 'redis');
        bluebird.promisifyAll(redis.RedisClient.prototype);
        bluebird.promisifyAll(redis.Multi.prototype);
    }

    private static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    public getDataFromCache<T>(key: string): Promise<Cache<T>> {
        return this.client.getAsync(key).then( (cache: string) => {
            if (cache == null) {
                return this.client.getAsync(`${key}:persisted`).then( (persistedCache: string) => {
                    if (persistedCache == null) {
                        return {
                            data: null,
                            status: CacheStatus.MISSING
                        };
                    } else {
                        return {
                            data: JSON.parse(persistedCache),
                            status: CacheStatus.EXPIRED
                        };
                    }
                });
            } else {
                return {
                    data: JSON.parse(cache),
                    status: CacheStatus.VALID
                };
            }
        });
    }

    public putDataToCache(key: string, data: object) {
        let json = JSON.stringify(data);

        this.client.multi()
            .set(key, json, 'EX', 14400 + RedisService.getRandomInt(1000))
            .set(`${key}:persisted`, json)
            .execAsync();
    }
}
