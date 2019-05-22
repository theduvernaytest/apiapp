import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import {EnvironmentVariablesService} from './services/environmentVariablesService';
import {iocContainer} from './inversify/ioc';

function bindDependencies(func, dependencies) {
    let injections = dependencies.map((dependency) => {
        return iocContainer.get(dependency);
    });
    return func.bind(func, ...injections);
}

export function expressAuthentication(request: express.Request, securityName: string, scopes?: string[]): Promise<any> {
    return bindDependencies((envService) => {
        if (securityName === 'jwt') {
            const token = request.headers.authorization;

            return new Promise((resolve, reject) => {
                if (!token) {
                    reject(new Error('No token provided'));
                }

                jwt.verify(token, envService.getJWTSecret(), function (err: any, decoded: any) {
                    if (err) {
                        reject(err);
                    } else {
                        for (let scope of scopes) {
                            if (!decoded.roles.includes(scope)) {
                                reject(new Error('JWT does not contain required scope.'));
                            }
                        }
                        resolve(decoded);
                    }
                });
            });
        }
    }, [EnvironmentVariablesService])();
}
