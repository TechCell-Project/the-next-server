import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthGoogleLoginDto } from './auth-google-login.dto';
import { SocialInterface } from '../auth/social/social.interface';

@Injectable()
export class AuthGoogleService {
    private google: OAuth2Client;

    constructor(private configService: ConfigService) {
        this.google = new OAuth2Client(
            configService.get('GOOGLE_CLIENT_ID'),
            configService.get('GOOGLE_CLIENT_SECRET'),
        );
    }

    async getProfileByToken(loginDto: AuthGoogleLoginDto): Promise<SocialInterface> {
        const ticket = await this.google.verifyIdToken({
            idToken: loginDto.idToken,
            audience: [this.configService.getOrThrow('GOOGLE_CLIENT_ID')],
        });

        const data = ticket.getPayload();

        if (!data) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'wrongToken',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        return {
            id: data.sub,
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
        };
    }
}
