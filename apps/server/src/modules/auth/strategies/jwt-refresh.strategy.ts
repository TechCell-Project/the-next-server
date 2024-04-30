import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';
import { OrNeverType } from '~/common/types';
import { AuthService } from '../auth.service';
import { AuthHttpExceptionDto } from '../dtos';
import { AuthErrorCodeEnum } from '../enums';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        configService: ConfigService,
        private readonly usersService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: configService.getOrThrow<string>('AUTH_REFRESH_SECRET'),
        });
    }

    public async validate(
        payload: JwtRefreshPayloadType,
    ): Promise<OrNeverType<JwtRefreshPayloadType>> {
        if (!payload.sessionId) {
            throw new AuthHttpExceptionDto({
                status: HttpStatus.UNAUTHORIZED,
                errors: {
                    token: 'invalidRefreshToken',
                },
                code: AuthErrorCodeEnum.RefreshTokenInvalid,
            });
        }

        if (await this.usersService.isTokenRevoked('refresh', payload.hash)) {
            throw new AuthHttpExceptionDto({
                status: HttpStatus.UNAUTHORIZED,
                errors: {
                    token: 'refreshTokenRevoked',
                },
                code: AuthErrorCodeEnum.RefreshTokenRevoked,
            });
        }
        return payload;
    }
}
