import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './auth-google-login.dto';
import { LoginResponseDto } from '../auth/dtos';
import { AuthProviderEnum } from '~/server/users/enums';
import { SocialInterface } from '../auth/social/social.interface';

@ApiTags('auth')
@Controller({
    path: 'auth/google',
    version: '1',
})
export class AuthGoogleController {
    constructor(
        private readonly authService: AuthService,
        private readonly authGoogleService: AuthGoogleService,
    ) {}

    @SerializeOptions({
        groups: ['me'],
    })
    @Post('login')
    @ApiOkResponse({ type: LoginResponseDto })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: AuthGoogleLoginDto): Promise<LoginResponseDto> {
        let socialData: SocialInterface | null = null;

        console.log(loginDto);
        if (!loginDto.idToken && !loginDto.accessTokenGoogle) {
            throw new BadRequestException('idToken or accessTokenGoogle is required');
        }

        if (loginDto.idToken) {
            socialData = await this.authGoogleService.getProfileByToken(loginDto.idToken);
        } else if (loginDto.accessTokenGoogle) {
            socialData = await this.authGoogleService.getProfileByAccessToken(
                loginDto.accessTokenGoogle,
            );
        }

        if (!socialData) {
            throw new BadRequestException('Failed to get social data');
        }

        return this.authService.validateSocialLogin(AuthProviderEnum.Google, socialData);
    }
}
