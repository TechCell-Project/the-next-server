import { Session } from '~/server/session';
import { User } from '~/server/users';

export type JwtRefreshPayloadType = Pick<User, 'role'> & {
    userId: string;
    sessionId: Session['_id'];
    hash: Session['hash'];
    iat: number;
    exp: number;
};
