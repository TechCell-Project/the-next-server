import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadType } from './types/jwt-payload.type';
import { OrNeverType } from '~/common/types';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private readonly usersService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('AUTH_JWT_SECRET'),
        });
    }

    // Why we don't check if the user exists in the database:
    // https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/auth.md#about-jwt-strategy
    public async validate(payload: JwtPayloadType): Promise<OrNeverType<JwtPayloadType>> {
        if (!payload.userId || !payload.sessionId) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        token: 'invalid',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        if (await this.usersService.isTokenRevoked('access', payload.hash)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        token: 'accessTokenRevoked',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        return payload;
    }
}
