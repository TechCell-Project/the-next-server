import { User } from 'src/modules/users';

export type JwtPayloadType = Pick<User, '_id' | 'role'> & {
    iat: number;
    exp: number;
};
