import { Injectable } from '@nestjs/common';
import { Facebook } from 'fb';
import { ConfigService } from '@nestjs/config';
import { FacebookInterface } from './interfaces/facebook.interface';
import { AuthFacebookLoginDto } from './dto/auth-facebook-login.dto';
import { SocialInterface } from '../auth/social/social.interface';

@Injectable()
export class AuthFacebookService {
    constructor(private configService: ConfigService) {}

    async getProfileByToken(loginDto: AuthFacebookLoginDto): Promise<SocialInterface> {
        const fb: Facebook = new Facebook({
            appId: this.configService.getOrThrow('FACEBOOK_APP_ID'),
            appSecret: this.configService.getOrThrow('FACEBOOK_APP_SECRET'),
            version: 'v7.0',
        });
        fb.setAccessToken(loginDto.accessToken);

        const data: FacebookInterface = await new Promise((resolve) => {
            fb.api('/me', 'get', { fields: 'id,last_name,email,first_name' }, (response: any) => {
                resolve(response);
            });
        });
        console.log(data);

        return {
            id: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
        };
    }
}
