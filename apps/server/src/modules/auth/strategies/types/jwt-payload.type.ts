import { User } from '~/modules/users';
import { Session } from '~/modules/session';

export type JwtPayloadType = Pick<User, 'role'> & {
    userId: string;
    sessionId: Session['_id'];
    hash: Session['hash'];
    iat: number;
    exp: number;
};
