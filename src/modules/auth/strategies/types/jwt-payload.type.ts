import { User } from 'src/modules/users';

export type JwtPayloadType = Pick<User, 'role'> & {
    userId: string;
    iat: number;
    exp: number;
    hash: string;
};
