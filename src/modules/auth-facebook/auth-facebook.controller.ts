import { Body, Controller, HttpCode, HttpStatus, Post, SerializeOptions } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthFacebookLoginDto } from './dto/auth-facebook-login.dto';
import { AuthProvider } from '../users/enums';
import { LoginResponseDto } from '../auth/dtos';

@ApiTags('auth')
@Controller({
    path: 'auth/facebook',
    version: '1',
})
export class AuthFacebookController {
    constructor(
        private readonly authService: AuthService,
        private readonly authFacebookService: AuthFacebookService,
    ) {}

    @SerializeOptions({
        groups: ['me'],
    })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: AuthFacebookLoginDto): Promise<LoginResponseDto> {
        const socialData = await this.authFacebookService.getProfileByToken(loginDto);

        return this.authService.validateSocialLogin(AuthProvider.Facebook, socialData);
    }
}
