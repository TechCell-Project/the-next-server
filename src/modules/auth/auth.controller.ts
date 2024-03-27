import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    SerializeOptions,
    Req,
    Get,
    UseGuards,
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
} from './dtos';
import { AuthRoles } from './guards';
import { AuthGuard } from '@nestjs/passport';
import { JwtRefreshPayloadType } from './strategies/types';
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
    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: User,
    })
    public me(@Req() request: { user: { userId: string } }): Promise<NullableType<User>> {
        return this.authService.me(request.user.userId);
    }

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
}
