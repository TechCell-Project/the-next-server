import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthSignupDto } from './dtos/auth-signup.dto';
import { AuthProvider, UserRole } from '../users/enums';
import { PinoLogger } from 'nestjs-pino';
import { SocialInterface } from './social/social.interface';
import { NullableType } from '~/common/types';
import { User } from '~/modules/users';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { AuthEmailLoginDto, LoginResponseDto } from './dtos';
import { TimeUnitOutPut, convertTimeString } from 'convert-time-string';
import { RedisService } from '~/common/redis';
import { PREFIX_REVOKE_ACCESS_TOKEN, PREFIX_REVOKE_REFRESH_TOKEN } from './auth.constant';

@Injectable()
export class AuthService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        // private mailService: MailService,
        private readonly redisService: RedisService,
    ) {}

    async register(dto: AuthSignupDto): Promise<void> {
        const userCreated = await this.usersService.create({
            ...dto,
            email: dto.email,
            role: UserRole.Customer,
        });

        const hash = await this.jwtService.signAsync(
            {
                confirmEmailUserId: userCreated._id,
            },
            {
                secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
                expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN'),
            },
        );
        this.logger.debug(`Register hash: ${hash}`);

        // await this.mailService.userSignUp({
        //     to: dto.email,
        //     data: {
        //         hash,
        //     },
        // });
    }
    async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        email: 'notFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (user.provider !== AuthProvider.Email) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        email: `needLoginViaProvider:${user.provider}`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (!user.password) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        password: 'incorrectPassword',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

        if (!isValidPassword) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        password: 'incorrectPassword',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const hash = crypto
            .createHash('sha256')
            .update(faker.string.alphanumeric(18))
            .digest('hex');

        // const session = await this.sessionService.create({
        //     user,
        //     hash,
        // });

        const { accessToken, refreshToken, accessTokenExpires } = await this.getTokensData({
            userId: user._id,
            role: user.role,
            hash,
        });

        return {
            accessToken,
            accessTokenExpires,
            refreshToken,
            user,
        };
    }

    async validateSocialLogin(authProvider: AuthProvider, socialData: SocialInterface) {
        let user: NullableType<User> = null;
        let userByEmail: NullableType<User> = null;
        const socialEmail = socialData.email?.toLowerCase();

        if (socialData.id) {
            user = await this.usersService.findBySocial(socialData.id, authProvider);
        }

        if (socialEmail) {
            userByEmail = await this.usersService.findByEmail(socialEmail);
        }

        if (user) {
            if (socialEmail && !userByEmail) {
                user.email = socialEmail;
                await this.usersService.update(user._id, user);
            }
        } else if (userByEmail) {
            user = userByEmail;
        } else if (socialData.id && socialEmail) {
            user = await this.usersService.create({
                email: socialEmail,
                socialId: socialData.id,
                provider: authProvider,
                role: UserRole.Customer,
                firstName: socialData?.firstName ?? faker.person.firstName(),
                lastName: socialData?.lastName ?? faker.person.lastName(),
                password: socialData.id + faker.string.alphanumeric(20) + uuid(),
            });

            user = await this.usersService.findById(user._id);
        }

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'userNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const hash = crypto
            .createHash('sha256')
            .update(faker.string.alphanumeric(18))
            .digest('hex');

        const { accessToken, refreshToken, accessTokenExpires } = await this.getTokensData({
            userId: user._id,
            role: user.role,
            hash,
        });

        return {
            accessToken,
            accessTokenExpires,
            refreshToken,
            user,
        };
    }

    async logout(hashAccessToken?: string) {
        if (!hashAccessToken) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        token: 'invalidToken',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        await this.revokeTokens('access', hashAccessToken);
    }

    async isTokenRevoked(tokenType: 'access' | 'refresh', sessionId: string) {
        if (tokenType === 'access') {
            return !!(await this.redisService.get(`${PREFIX_REVOKE_ACCESS_TOKEN}${sessionId}`));
        } else if (tokenType === 'refresh') {
            return !!(await this.redisService.get(`${PREFIX_REVOKE_REFRESH_TOKEN}${sessionId}`));
        }
        return false;
    }

    async me(userId: User['_id'] | string) {
        return this.usersService.findById(userId);
    }

    private async getTokensData(data: { userId: User['_id']; role: User['role']; hash: string }) {
        const accessTokenExpiresIn = this.configService.getOrThrow('AUTH_JWT_TOKEN_EXPIRES_IN');
        const accessTokenExpires: number = Date.now() + convertTimeString(accessTokenExpiresIn);

        const [accessToken, refreshToken] = await Promise.all([
            await this.jwtService.signAsync(
                {
                    userId: data.userId,
                    role: data.role,
                    hash: data.hash,
                },
                {
                    secret: this.configService.getOrThrow('AUTH_JWT_SECRET'),
                    expiresIn: accessTokenExpiresIn,
                },
            ),
            await this.jwtService.signAsync(
                {
                    userId: data.userId,
                    role: data.role,
                    hash: data.hash,
                },
                {
                    secret: this.configService.getOrThrow('AUTH_REFRESH_SECRET'),
                    expiresIn: this.configService.getOrThrow('AUTH_REFRESH_TOKEN_EXPIRES_IN'),
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
            accessTokenExpires,
        };
    }

    private async revokeTokens(tokenType: 'access' | 'refresh', sessionId: string) {
        if (tokenType === 'access') {
            await this.redisService.set(
                `${PREFIX_REVOKE_ACCESS_TOKEN}${sessionId}`,
                true,
                convertTimeString(this.configService.getOrThrow('AUTH_JWT_TOKEN_EXPIRES_IN')),
            );
        } else if (tokenType === 'refresh') {
            await this.redisService.set(
                `${PREFIX_REVOKE_REFRESH_TOKEN}${sessionId}`,
                true,
                convertTimeString(this.configService.getOrThrow('AUTH_REFRESH_TOKEN_EXPIRES_IN')),
            );
        }
    }
}
