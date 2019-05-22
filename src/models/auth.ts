export interface FacebookAuthRequest {
    facebookToken: string;
    name: string;
    email: string;
    userId: string;
}

export interface GoogleAuthRequest {
    googleToken: string;
    name: string;
}

export type SessionResolutionStatus = 'Succeed' | 'Failed';

export interface Session {
    status: SessionResolutionStatus;
    token: string;
}
