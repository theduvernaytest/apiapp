import * as express from 'express';
import {provideSingleton} from '../inversify/ioc';
import {Body, Get, Header, Post, Route, Security, Request} from 'tsoa';
import {inject} from 'inversify';
import {MongoService} from '../services/mongoService';
import {Subscribe} from '../models/subscribe';
import {mapValues, escape} from 'lodash';
import {ReCaptchaService} from '../services/recaptchaService';

@Route('Subscribe')
@provideSingleton(SubscribeController)
export class SubscribeController {
    constructor(
        @inject(MongoService) private mongoService: MongoService,
        @inject(ReCaptchaService) private reCaptchaService: ReCaptchaService
    ) {}

    /**
     * Get list of subscribers
     * @returns {Promise<Subscribe[]>}
     */
    @Security('jwt', ['Admin'])
    @Get('')
    public async Get(): Promise<Subscribe[]> {
        return this.mongoService.getSubscribers();
    }

    /**
     * Subscribe
     */
    @Post()
    public async Post(
        @Body() body: Subscribe,
        @Header('g-recaptcha-response') recaptchaToken: string,
        @Request() request: express.Request
    ): Promise<Subscribe | null> {
        return this.reCaptchaService.verify(recaptchaToken).then((r) => {
            if (r === true) {
                return this.mongoService.createSubscriber(mapValues(body, (v) => escape(v)));
            } else {
                throw new Error('Cannot validate recaptcha.');
            }
        });

    }
}
