import {provideSingleton} from '../inversify/ioc';
import {EnvironmentVariablesService} from './environmentVariablesService';
import {User} from './mongoService';
import {inject} from 'inversify';
import * as jwt from 'jsonwebtoken';
import {omit} from 'lodash';
import {OAuth2Client} from 'google-auth-library';
import * as bluebird from 'bluebird';
import fetch from 'node-fetch';

const FACEBOOK_URL = 'https://graph.facebook.com/';
const FACEBOOK_VERIFY_TOKEN_URL = `${FACEBOOK_URL}debug_token`;
const FACEBOOK_ACCESS_TOKEN_URL = `${FACEBOOK_URL}oauth/access_token`;

interface GoogleVerificationResult {
    id: number;
    userEmail: string;
}

@provideSingleton(AuthService)
export class AuthService {
    constructor(
        @inject(EnvironmentVariablesService) private envService: EnvironmentVariablesService
    ) { }

    /*
     * Verifies Facebook token and returns user id or null.
     */
    public verifyFacebookToken(token: string, userId: string): Promise<number | null> {
        const facebookClientId = this.envService.getFacebookClientId();
        const facebookAccessToken = this.envService.getFacebookAccessToken();

        return fetch(`${FACEBOOK_ACCESS_TOKEN_URL}?client_id=${facebookClientId}&client_secret=${facebookAccessToken}&grant_type=client_credentials`)
            .then((accessTokenResp) => accessTokenResp.json())
            .then((accessTokenJson) => {
                return fetch(`${FACEBOOK_VERIFY_TOKEN_URL}?input_token=${token}&access_token=${accessTokenJson.access_token}`)
                    .then((verifyTokenResp) => verifyTokenResp.json())
                    .then((json) => json.data.user_id === userId ? userId : null )
                    .catch(() => null);
            });
    }


    /*
     * Verifies Google token and returns user id or null.
     */
    public verifyGoogleToken(token: string): Promise<GoogleVerificationResult | null> {
        const clientId = this.envService.getGoogleAPIClientId();
        const client = new OAuth2Client(clientId, '', '');

        const verifyIdToken = bluebird.promisify(client.verifyIdToken);

        return verifyIdToken.bind(client)({
            audience: clientId,
            idToken: token
        }).then((result) => {
            const payload = result.getPayload();
            return payload && payload['sub'] ? {
                id: payload['sub'],
                userEmail: payload['email']
            } : null;
        });
    }

    /*
     * Returns JWT token which contains all fields of user structure
     */
    public generateJWT(user: User): string {
        const options = {
            expiresIn: this.envService.getJWTExpirationTime(),
            subject: user._id.toHexString()
        };

        return jwt.sign(omit(user, '_id'), this.envService.getJWTSecret(), options);
    }
}
