import { User } from '~/server/users';
import { Session } from '~/server/session';

export type JwtPayloadType = Pick<User, 'role'> & {
    userId: string;
    sessionId: Session['_id'];
    hash: Session['hash'];
    iat: number;
    exp: number;
};
