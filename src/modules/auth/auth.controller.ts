import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    SerializeOptions,
    Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthSignupDto, AuthEmailLoginDto, LoginResponseDto } from './dtos';
import { AuthRoles } from './guards';

@ApiTags('auth')
@Controller({
    path: 'auth',
})
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('email/register')
    @HttpCode(HttpStatus.NO_CONTENT)
    async register(@Body() createUserDto: AuthSignupDto): Promise<void> {
        return this.authService.register(createUserDto);
    }

    @SerializeOptions({
        groups: ['me'],
    })
    @Post('email/login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: LoginResponseDto })
    public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
        return this.authService.validateLogin(loginDto);
    }

    @AuthRoles()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    public async logout(@Req() req: { user: { hash?: string } }) {
        return this.authService.logout(req.user?.hash);
    }
}
