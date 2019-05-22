import {Body, Get, Header, Post, Request, Route, Security} from 'tsoa';
import {provideSingleton} from '../inversify/ioc';
import {MongoService} from '../services/mongoService';
import {inject} from 'inversify';
import {ContactUsMessage} from '../models/contactus';
import {escape, mapValues} from 'lodash';
import * as express from 'express';
import {ReCaptchaService} from '../services/recaptchaService';
import {MailService} from '../services/mailService';

@Route('ContactUs')
@provideSingleton(ContactUsController)
export class ContactUsController {
    constructor(
        @inject(MongoService) private mongoService: MongoService,
        @inject(ReCaptchaService) private reCaptchaService: ReCaptchaService,
        @inject(MailService) private mailService: MailService
    ) {}

    /**
     * Get all ContactUs messages. Only admins can do it.
     * @returns {Promise<ContactUsMessage[]>}
     */
    @Security('jwt', ['Admin'])
    @Get('')
    public async Get(): Promise<ContactUsMessage[]> {
        return this.mongoService.getContactUsMessages();
    }

    /**
     * Send message through contact us form. Everyone can do it.
     * @param {ContactUsMessage} body
     * @param {string} recaptchaToken Google ReCaptcha token
     * @param {express.Request} request object, we need it to get client's IP
     * @returns {Promise<ContactUsMessage>}
     */
    @Post()
    public async Post(
        @Body() body: ContactUsMessage,
        @Header('g-recaptcha-response') recaptchaToken: string,
        @Request() request: express.Request
    ): Promise<ContactUsMessage> {
        return this.reCaptchaService.verify(recaptchaToken).then((r) => {
            if (r === true) {
                const escapedMessage = mapValues(body, (v) => escape(v));

                this.mailService.sendMessageFromContactUsFormToOurMailServer(escapedMessage);
                return this.mongoService.createContactUsMessage(escapedMessage);
            } else {
                throw new Error('Cannot validate recaptcha.');
            }
        });
    }
}
