import { Session } from '~/modules/session';
import { User } from '~/modules/users';

export type JwtRefreshPayloadType = Pick<User, 'role'> & {
    userId: string;
    sessionId: Session['_id'];
    hash: Session['hash'];
    iat: number;
    exp: number;
};
