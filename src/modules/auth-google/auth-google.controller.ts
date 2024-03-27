import { Body, Controller, HttpCode, HttpStatus, Post, SerializeOptions } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './auth-google-login.dto';
import { LoginResponseDto } from '../auth/dtos';
import { AuthProvider } from '~/modules/users/enums';

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
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: AuthGoogleLoginDto): Promise<LoginResponseDto> {
        const socialData = await this.authGoogleService.getProfileByToken(loginDto);

        return this.authService.validateSocialLogin(AuthProvider.Google, socialData);
    }
}
