import {provideSingleton} from '../inversify/ioc';
import * as fs from 'fs';

@provideSingleton(EnvironmentVariablesService)
export class EnvironmentVariablesService {
    private theMovieDbKey: string;
    private jwtSecret: string;
    private jwtExpirationTime: string;
    private facebookClientId: string;
    private facebookAccessToken: string;
    private googleAPIClientId: string;
    private grecaptchaSecret: string;
    private grecaptchaEnabled: string;
    private mongoUrl: string;
    private smtpHost: string;
    private smtpPort: string;
    private smtpUser: string;
    private smtpPass: string;

    constructor() {
        function getVariable(name: string) {
            if (process.env[`${name}_FILE`]) {
                return fs.readFileSync(process.env[`${name}_FILE`], 'utf8').toString().trim();
            } else {
                return process.env[name];
            }
        }

        this.theMovieDbKey = getVariable('THE_MOVIE_DB_KEY');
        this.jwtSecret = getVariable('JWT_SECRET');
        this.jwtExpirationTime = getVariable('JWT_EXPIRATION');
        this.facebookClientId = getVariable('FACEBOOK_CLIENT_ID');
        this.facebookAccessToken = getVariable('FACEBOOK_ACCESS_TOKEN');
        this.googleAPIClientId = getVariable('GOOGLE_API_CLIENT_ID');
        this.grecaptchaSecret = getVariable('GOOGLE_RECAPTCHA_SECRET');
        this.grecaptchaEnabled = getVariable('GOOGLE_RECAPTCHA_ENABLED');
        this.mongoUrl = getVariable('MONGO_URL');
        this.smtpHost = getVariable('SMTP_HOST');
        this.smtpPort = getVariable('SMTP_PORT');
        this.smtpUser = getVariable('SMTP_USER');
        this.smtpPass = getVariable('SMTP_PASS');
    }

    public getTheMovieDBKey(): string {
        return this.theMovieDbKey;
    }

    public getJWTSecret(): string {
        return this.jwtSecret;
    }

    public getJWTExpirationTime(): string {
        return this.jwtExpirationTime;
    }

    public getFacebookClientId(): string {
        return this.facebookClientId;
    }

    public getFacebookAccessToken(): string {
        return this.facebookAccessToken;
    }

    public getGoogleAPIClientId(): string {
        return this.googleAPIClientId;
    }

    public getGrecaptchaSecret(): string {
        return this.grecaptchaSecret;
    }

    public isGrecaptchaEnabled(): boolean {
        return !!(+this.grecaptchaEnabled);
    }

    public getMongoUrl(): string {
        return this.mongoUrl;
    }

    public getSmtpHost(): string {
        return this.smtpHost;
    }

    public getSmtpPort(): number {
        return +this.smtpPort;
    }

    public getSmtpUser(): string {
        return this.smtpUser;
    }

    public getSmtpPass(): string {
        return this.smtpPass;
    }
}
