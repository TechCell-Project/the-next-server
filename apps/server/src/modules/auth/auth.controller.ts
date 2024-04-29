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
    UseGuards,
} from '@nestjs/common';
import {
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
    ApiBody,
    ApiExtraModels,
} from '@nestjs/swagger';
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
    RefreshTokenDto,
    GetMeResponseDto,
    AuthHttpExceptionDto,
} from './dtos';
import { AuthRoles } from './guards';
import { JwtPayloadType, JwtRefreshPayloadType } from './strategies/types';
import { Types } from 'mongoose';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '~/common';

@ApiExtraModels(AuthHttpExceptionDto)
@ApiTags('auth')
@Controller({
    path: 'auth',
})
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('email/register')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Success' })
    async register(@Body() createUserDto: AuthSignupDto): Promise<void> {
        return this.authService.register(createUserDto);
    }

    @Post('email/resend-confirm')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Success' })
    async resendConfirmEmail(@Body() { email }: ResendConfirmEmail): Promise<void> {
        return this.authService.resendConfirmEmail(email);
    }

    @Post('email/confirm')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Success' })
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
    @ApiNoContentResponse({ description: 'Success' })
    @Post('logout')
    public async logout(
        @Req() req: { user: { sessionId: Pick<JwtRefreshPayloadType, 'sessionId'> } },
    ) {
        await this.authService.logout({
            sessionId: req.user.sessionId as unknown as Types.ObjectId,
        });
    }

    @ApiBody({
        type: RefreshTokenDto,
    })
    @UseGuards(AuthGuard('jwt-refresh'))
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
    @ApiNoContentResponse({ description: 'Success' })
    async forgotPassword(@Body() forgotPasswordDto: AuthForgotPasswordDto): Promise<void> {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Success' })
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
        type: GetMeResponseDto,
    })
    public getMe(@CurrentUser() { userId }: JwtPayloadType): Promise<GetMeResponseDto> {
        return this.authService.me(userId);
    }

    @AuthRoles()
    @Patch('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    public updateMe(@Req() request: { user: JwtPayloadType }, @Body() userDto: AuthUpdateDto) {
        return this.authService.updateUser(request.user, userDto);
    }
}
