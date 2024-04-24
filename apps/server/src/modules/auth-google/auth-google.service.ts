import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { SocialInterface } from '../auth/social/social.interface';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthGoogleService {
    private google: OAuth2Client;

    constructor(
        private configService: ConfigService,
        private readonly http: HttpService,
        private readonly logger: PinoLogger,
    ) {
        this.google = new OAuth2Client(
            configService.get('GOOGLE_CLIENT_ID'),
            configService.get('GOOGLE_CLIENT_SECRET'),
        );
    }

    async getProfileByToken(idToken: string): Promise<SocialInterface> {
        const ticket = await this.google.verifyIdToken({
            idToken: idToken,
            audience: [this.configService.getOrThrow('GOOGLE_CLIENT_ID')],
        });

        const data = ticket.getPayload();

        if (!data) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'wrongIdToken',
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

    async getProfileByAccessToken(accessToken: string): Promise<SocialInterface> {
        const { data: userInfo } = await firstValueFrom(
            this.http
                .get<TokenPayload>('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                })
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response?.data);
                        throw new HttpException(
                            {
                                status: HttpStatus.UNPROCESSABLE_ENTITY,
                                errors: {
                                    user: 'wrongAccessToken',
                                },
                            },
                            HttpStatus.UNPROCESSABLE_ENTITY,
                        );
                    }),
                ),
        );

        return {
            id: userInfo.sub,
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
        };
    }
}
