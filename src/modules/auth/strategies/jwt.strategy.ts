import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadType } from './types/jwt-payload.type';
import { OrNeverType } from '~/common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('AUTH_JWT_SECRET'),
        });
    }

    // Why we don't check if the user exists in the database:
    // https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/auth.md#about-jwt-strategy
    public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
        if (!payload._id) {
            throw new UnauthorizedException();
        }

        return payload;
    }
}
