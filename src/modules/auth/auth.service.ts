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
import { AuthEmailLoginDto, AuthUpdateDto, LoginResponseDto } from './dtos';
import { convertTimeString } from 'convert-time-string';
import { RedisService } from '~/common/redis';
import { PREFIX_REVOKE_ACCESS_TOKEN, PREFIX_REVOKE_REFRESH_TOKEN } from './auth.constant';
import { JwtPayloadType, JwtRefreshPayloadType } from './strategies/types';
import { Session, SessionService } from '~/modules/session';
import { MailService } from '~/modules/mail';
import { GhnService } from '~/third-party';

@Injectable()
export class AuthService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly mailService: MailService,
        private readonly redisService: RedisService,
        private readonly sessionService: SessionService,
        private readonly ghnService: GhnService,
    ) {}

    async register(dto: AuthSignupDto): Promise<void> {
        const userCreated = await this.usersService.create({
            ...dto,
            email: dto.email,
            role: UserRole.Customer,
        });
        const key = `user:${userCreated._id.toString()}:confirmEmailHash`;

        const hash = await this.jwtService.signAsync(
            {
                confirmEmailUserId: userCreated._id,
            },
            {
                secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
                expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN'),
            },
        );

        await Promise.all([
            this.redisService.set(
                key,
                { hash },
                convertTimeString(
                    this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN'),
                ),
            ),
            this.mailService.sendConfirmMail({
                to: userCreated.email,
                mailData: {
                    hash,
                },
            }),
        ]);
    }

    async resendConfirmEmail(email: string): Promise<void> {
        const userFound = await this.usersService.findByEmail(email);
        if (!userFound) {
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

        const key = `auth:confirmEmailHash:${userFound._id.toString()}`;

        if (userFound.emailVerified === true) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyConfirmed',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const hash = await this.jwtService.signAsync(
            {
                confirmEmailUserId: userFound._id,
            },
            {
                secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
                expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN'),
            },
        );

        await this.redisService.del(key);
        await Promise.all([
            this.redisService.set(
                key,
                { hash },
                convertTimeString(
                    this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN'),
                ),
            ),
            this.mailService.sendConfirmMail({
                to: email,
                mailData: {
                    hash,
                },
                isResend: true,
            }),
        ]);
    }

    async confirmEmail(hash: string): Promise<void> {
        let userId: User['_id'];

        try {
            const jwtData = await this.jwtService.verifyAsync<{
                confirmEmailUserId: User['_id'];
            }>(hash, {
                secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
            });

            userId = jwtData.confirmEmailUserId;
        } catch {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        hash: `invalidHash`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.NOT_FOUND,
                    error: `notFound`,
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const key = `auth:confirmEmailHash:${user._id.toString()}`;

        if (!(await this.redisService.existsUniqueKey(key))) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        hash: `invalidHash`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (user.emailVerified === true) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        user: 'alreadyConfirmed',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        user.emailVerified = true;
        await Promise.all([this.redisService.del(key), this.usersService.update(user._id, user)]);
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

        const session = await this.sessionService.create({
            user,
            hash,
        });

        const { accessToken, refreshToken, accessTokenExpires } = await this.getTokensData({
            userId: user._id,
            role: user.role,
            hash,
            sessionId: session._id,
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

        const session = await this.sessionService.create({
            user,
            hash,
        });

        const { accessToken, refreshToken, accessTokenExpires } = await this.getTokensData({
            userId: user._id,
            role: user.role,
            hash,
            sessionId: session._id,
        });

        return {
            accessToken,
            accessTokenExpires,
            refreshToken,
            user,
        };
    }

    async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
        return this.sessionService.softDelete({
            id: data.sessionId,
        });
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

    async refreshToken(data: JwtRefreshPayloadType): Promise<Omit<LoginResponseDto, 'user'>> {
        const session = await this.sessionService.findOne({
            _id: data.sessionId,
        });

        if (!session || session.hash !== data.hash) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        token: 'tokenDataDoesNotMatch',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const hash = crypto
            .createHash('sha256')
            .update(faker.string.alphanumeric(18))
            .digest('hex');

        const user = await this.usersService.findById(session.user._id);

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.UNAUTHORIZED,
                    errors: {
                        user: 'userNotFound',
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        await this.sessionService.update(session._id, {
            hash,
        });

        const { accessToken, refreshToken, accessTokenExpires } = await this.getTokensData({
            userId: session.user._id,
            role: user.role,
            sessionId: session._id,
            hash,
        });

        return { accessToken, refreshToken, accessTokenExpires };
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        email: 'emailNotExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const tokenExpiresIn = this.configService.getOrThrow('AUTH_FORGOT_TOKEN_EXPIRES_IN');

        const tokenExpires = Date.now() + convertTimeString(tokenExpiresIn);

        const hash = await this.jwtService.signAsync(
            {
                forgotUserId: user._id,
            },
            {
                secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
                expiresIn: tokenExpiresIn,
            },
        );

        const key = `auth:forgotPassword:${user._id.toString()}`;
        await Promise.all([
            this.redisService.set(key, { hash, tokenExpires }, convertTimeString(tokenExpiresIn)),
            this.mailService.forgotPassword({
                to: user.email,
                data: {
                    hash,
                    tokenExpires,
                },
            }),
        ]);
    }

    async resetPassword(hash: string, password: string): Promise<void> {
        let userId: User['_id'];

        try {
            const jwtData = await this.jwtService.verifyAsync<{
                forgotUserId: User['_id'];
            }>(hash, {
                secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
            });

            userId = jwtData.forgotUserId;
        } catch {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        hash: `invalidHash`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        hash: `notFound`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        const key = `auth:forgotPassword:${user._id.toString()}`;

        if (!this.redisService.existsUniqueKey(key)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        hash: `hashRevoked`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        user.password = password;

        await Promise.all([
            this.redisService.del(key),
            this.sessionService.softDelete({
                user: {
                    _id: user._id,
                },
            }),
            this.usersService.update(user._id, user),
        ]);
    }

    async update(
        userJwtPayload: JwtPayloadType,
        userDto: AuthUpdateDto,
    ): Promise<NullableType<User>> {
        const userData = userDto;
        if (userData?.userName) {
            const user = await this.usersService.findByUserName(userData.userName);
            if (user) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            userName: 'userNameAlreadyExists',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        }

        if (userData.password) {
            if (!userData.oldPassword) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            oldPassword: 'missingOldPassword',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            const currentUser = await this.usersService.findById(userJwtPayload.userId);

            if (!currentUser) {
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

            if (!currentUser.password) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            oldPassword: 'incorrectOldPassword',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            const isValidOldPassword = await bcrypt.compare(
                userData.oldPassword,
                currentUser.password,
            );

            if (!isValidOldPassword) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            oldPassword: 'incorrectOldPassword',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            } else {
                await this.sessionService.softDelete({
                    user: {
                        _id: currentUser._id,
                    },
                    excludeId: userJwtPayload.sessionId,
                });
            }
        }

        if (userData?.address !== null || userData?.address !== undefined) {
            if (userData.address?.length === 0) {
                userData.address = [];
            } else if (userData.address && userData.address?.length > 0) {
                const addressPromises = userData.address.map((address) =>
                    this.ghnService.getSelectedAddress(address),
                );

                try {
                    await Promise.all(addressPromises ?? []);
                } catch (error) {
                    throw new HttpException(
                        {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            errors: {
                                address: 'invalidAddress',
                                message: error.message,
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }

                const defaultAddresses = userData.address.filter((address) => address?.isDefault);
                if (defaultAddresses.length > 1) {
                    throw new HttpException(
                        {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            errors: {
                                address: 'Only one address can be set as default.',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                } else if (defaultAddresses.length <= 0) {
                    userData.address[0].isDefault = true;
                }
            }
        }

        await this.usersService.update(userJwtPayload.userId, userData);

        return new User(await this.usersService.findById(userJwtPayload.userId));
    }

    private async getTokensData(data: {
        userId: User['_id'];
        role: User['role'];
        sessionId: Session['_id'];
        hash: Session['hash'];
    }) {
        const accessTokenExpiresIn = this.configService.getOrThrow('AUTH_JWT_TOKEN_EXPIRES_IN');
        const accessTokenExpires: number = Date.now() + convertTimeString(accessTokenExpiresIn);

        const [accessToken, refreshToken] = await Promise.all([
            await this.jwtService.signAsync(
                {
                    userId: data.userId.toString(),
                    role: data.role,
                    sessionId: data.sessionId,
                } as Omit<JwtPayloadType, 'iat' | 'exp'>,
                {
                    secret: this.configService.getOrThrow('AUTH_JWT_SECRET'),
                    expiresIn: accessTokenExpiresIn,
                },
            ),
            await this.jwtService.signAsync(
                {
                    sessionId: data.sessionId,
                    hash: data.hash,
                } as Omit<JwtRefreshPayloadType, 'iat' | 'exp'>,
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
