import {Route, Post, Body} from 'tsoa';
import {
    FacebookAuthRequest, GoogleAuthRequest, Session
} from '../models/auth';
import {provideSingleton} from '../inversify/ioc';
import {AuthService} from '../services/authService';
import {inject} from 'inversify';
import {MongoService, User} from '../services/mongoService';

@Route('Users')
@provideSingleton(UsersController)
export class UsersController {
    constructor(
        @inject(AuthService) private authService: AuthService,
        @inject(MongoService) private mongoService: MongoService
    ) { }

    /**
     * Login with facebook
     * @param request FacebookAuth structure
     */
    @Post('login/facebook')
    public async LoginFacebook(@Body() request: FacebookAuthRequest): Promise<Session> {
        return this.authService.verifyFacebookToken(request.facebookToken, request.userId).then((id) => {
            if (id) {
                return this.mongoService.getUserByFacebookId(id).then((user) => {
                    if (user) {
                        return <Session>{
                            status: 'Succeed',
                            token: this.authService.generateJWT(user)
                        };
                    } else {
                        const newUser: User = {
                            email: request.email,
                            facebookId: id,
                            googleId: null,
                            name: request.name,
                            roles: ['User']
                        };

                        return this.mongoService.createUser(newUser).then(() => {
                            return <Session>{
                                status: 'Succeed',
                                token: this.authService.generateJWT(newUser)
                            };
                        });
                    }
                });
            } else {
                return <Session>{
                    status: 'Failed',
                    token: 'Invalid token'
                };
            }
        });
    }

    /**
     * Login with google token
     * @param request This is a user creation request description
     */
    @Post('login/google')
    public async LoginGoogle(@Body() request: GoogleAuthRequest): Promise<Session> {
        return this.authService.verifyGoogleToken(request.googleToken).then(({id, userEmail}) => {
            if (id) {
                return this.mongoService.getUserByGoogleId(id).then((user) => {
                    if (user) {
                        return <Session>{
                            status: 'Succeed',
                            token: this.authService.generateJWT(user)
                        };
                    } else {
                        const newUser: User = {
                            email: userEmail,
                            facebookId: null,
                            googleId: id,
                            name: request.name,
                            roles: ['User']
                        };

                        return this.mongoService.createUser(newUser).then(() => {
                            return <Session>{
                                status: 'Succeed',
                                token: this.authService.generateJWT(newUser)
                            };
                        });
                    }
                });
            } else {
                return <Session>{
                    status: 'Failed',
                    token: 'Invalid token'
                };
            }
        });
    }
}
