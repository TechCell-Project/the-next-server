import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    SerializeOptions,
    Req,
    Get,
    Patch,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NullableType } from '~/common/types';
import { User } from '~/modules/users';
import { AuthService } from './auth.service';
import {
    AuthSignupDto,
    AuthEmailLoginDto,
    LoginResponseDto,
    RefreshTokenResponseDto,
    ResendConfirmEmail,
    AuthConfirmEmailDto,
    AuthForgotPasswordDto,
    AuthResetPasswordDto,
    AuthUpdateDto,
} from './dtos';
import { AuthRoles } from './guards';
import { JwtPayloadType, JwtRefreshPayloadType } from './strategies/types';
import { Types } from 'mongoose';

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

    @Post('email/resend-confirm')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resendConfirmEmail(@Body() { email }: ResendConfirmEmail): Promise<void> {
        return this.authService.resendConfirmEmail(email);
    }

    @Post('email/confirm')
    @HttpCode(HttpStatus.NO_CONTENT)
    async confirmEmail(@Body() confirmEmailDto: AuthConfirmEmailDto): Promise<void> {
        return this.authService.confirmEmail(confirmEmailDto.hash);
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
    public async logout(
        @Req() req: { user: { sessionId: Pick<JwtRefreshPayloadType, 'sessionId'> } },
    ) {
        await this.authService.logout({
            sessionId: req.user.sessionId as unknown as Types.ObjectId,
        });
    }

    @AuthRoles()
    @SerializeOptions({
        groups: ['me'],
    })
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: RefreshTokenResponseDto })
    public refresh(
        @Req() request: { user: JwtRefreshPayloadType },
    ): Promise<Omit<LoginResponseDto, 'user'>> {
        return this.authService.refreshToken(request.user);
    }

    @Post('forgot/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto): Promise<void> {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
        return this.authService.resetPassword(resetPasswordDto.hash, resetPasswordDto.password);
    }

    @AuthRoles()
    @SerializeOptions({
        groups: ['me'],
    })
    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: User,
    })
    public me(@Req() request: { user: { userId: string } }): Promise<NullableType<User>> {
        return this.authService.me(request.user.userId);
    }

    @AuthRoles()
    @SerializeOptions({
        groups: ['me'],
    })
    @Patch('me')
    @HttpCode(HttpStatus.OK)
    public update(
        @Req() request: { user: JwtPayloadType },
        @Body() userDto: AuthUpdateDto,
    ): Promise<NullableType<User>> {
        return this.authService.update(request.user, userDto);
    }
}
