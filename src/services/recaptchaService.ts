import {provideSingleton} from '../inversify/ioc';
import {inject} from 'inversify';
import {EnvironmentVariablesService} from './environmentVariablesService';
import fetch from 'node-fetch';
import {Logger, transports} from 'winston';

interface CaptchaResponse {
    success: boolean;
    challenge_ts: Date;
    hostname: String;
    error_codes: Array<String>;
}

@provideSingleton(ReCaptchaService)
export class ReCaptchaService {
    private logger;

    constructor(
        @inject(EnvironmentVariablesService) private envService: EnvironmentVariablesService
    ) {
        this.logger = new Logger({
            transports: [
                new transports.Console()
            ]
        });
    }

    public verify(token: string): Promise<Boolean> {
        const secret = this.envService.getGrecaptchaSecret();
        const isRecaptchaEnabled = this.envService.isGrecaptchaEnabled();

        if (isRecaptchaEnabled) {
            return fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`, {
                method: 'POST'
            }).then((response) => {
                return response.json().then((captchaResponse: CaptchaResponse) => {
                    this.logger.debug(JSON.stringify(captchaResponse));
                    return captchaResponse.success;
                });
            });
        } else {
            return new Promise((resolve) => resolve(true));
        }
    }
}
