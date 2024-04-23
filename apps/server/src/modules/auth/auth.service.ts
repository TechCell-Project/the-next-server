import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthSignupDto } from './dtos/auth-signup.dto';
import { AuthProviderEnum, UserRoleEnum } from '../users/enums';
import { PinoLogger } from 'nestjs-pino';
import { SocialInterface } from './social/social.interface';
import { NullableType } from '~/common/types';
import { User } from '~/server/users';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { AuthEmailLoginDto, AuthForgotPasswordDto, AuthUpdateDto, LoginResponseDto } from './dtos';
import { convertTimeString } from 'convert-time-string';
import { RedisService } from '~/common/redis';
import { PREFIX_REVOKE_ACCESS_TOKEN, PREFIX_REVOKE_REFRESH_TOKEN } from './auth.constant';
import { JwtPayloadType, JwtRefreshPayloadType } from './strategies/types';
import { Session, SessionService } from '~/server/session';
import { GhnService } from '~/third-party';
import { MailEventPattern } from '~/communication/mail/mail.pattern';
import { ClientRMQ } from '@nestjs/microservices';
import { ImagesService } from '~/server/images';
import { AvatarSchema } from '../users/schemas/avatar.schema';
import { GetMeResponseDto } from './dtos/get-me-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly redisService: RedisService,
        private readonly sessionService: SessionService,
        private readonly ghnService: GhnService,
        @Inject('COMMUNICATION_SERVICE') private readonly mailService: ClientRMQ,
        private readonly imagesService: ImagesService,
    ) {
        this.logger.setContext(AuthService.name);
    }

    async register(dto: AuthSignupDto): Promise<any> {
        if (await this.usersService.findByEmail(dto.email)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        email: 'emailAlreadyExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (dto?.password) {
            const salt = await bcrypt.genSalt();
            dto.password = await bcrypt.hash(dto.password, salt);
        }

        const userCreated = await this.usersService.usersRepository.create({
            document: {
                ...dto,
                email: dto.email,
                emailVerified: false,
                role: UserRoleEnum.Customer,
                provider: AuthProviderEnum.Email,
            },
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
        ]);

        this.mailService.emit(MailEventPattern.sendConfirmMail, {
            to: userCreated.email,
            mailData: {
                hash,
            },
        });
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
        ]);

        this.mailService.emit(MailEventPattern.sendConfirmMail, {
            to: email,
            mailData: {
                hash,
            },
            isResend: true,
        });
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

        if (user.provider !== AuthProviderEnum.Email) {
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

    async validateSocialLogin(authProvider: AuthProviderEnum, socialData: SocialInterface) {
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
                role: UserRoleEnum.Customer,
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
        const userFound = await this.usersService.findById(userId);
        if (!userFound) {
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
        const provinceIdSet = new Set<number>();
        const districtIdSet = new Set<number>();

        (userFound.address || []).forEach((address) => {
            provinceIdSet.add(address.provinceLevel?.provinceId ?? 0);
            districtIdSet.add(address.districtLevel?.districtId ?? 0);
        });

        const provinceArray = await this.ghnService.getProvinces();
        const provinceList = new Map(
            provinceArray
                .filter((province) => provinceIdSet.has(province.provinceId))
                .map((province) => [province.provinceId, province]),
        );

        const districtArray = await Promise.all(
            Array.from(provinceIdSet).map((provinceId) => this.ghnService.getDistricts(provinceId)),
        );
        const districtList = new Map(
            districtArray.map((districts, index) => [Array.from(provinceIdSet)[index], districts]),
        );

        const wardArray = await Promise.all(
            Array.from(districtIdSet).map((districtId) => this.ghnService.getWards(districtId)),
        );
        const wardList = new Map(
            wardArray.map((wards, index) => [Array.from(districtIdSet)[index], wards]),
        );

        const userWithAddress = new GetMeResponseDto({
            ...userFound,
            address: userFound.address?.map((address) => ({
                ...address,
                provinceLevel: {
                    ...address.provinceLevel,
                    provinceName:
                        provinceList.get(address.provinceLevel.provinceId)?.provinceName ?? '',
                },
                districtLevel: {
                    ...address.districtLevel,
                    districtName:
                        districtList
                            .get(address.provinceLevel.provinceId)
                            ?.find(
                                (district) =>
                                    district.districtId === address.districtLevel.districtId,
                            )?.districtName ?? '',
                },
                wardLevel: {
                    ...address.wardLevel,
                    wardName:
                        wardList
                            .get(address.districtLevel.districtId)
                            ?.find((ward) => ward.wardCode === address.wardLevel.wardCode)
                            ?.wardName ?? '',
                },
            })),
        });
        return userWithAddress;
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

    async forgotPassword({ email, returnUrl }: AuthForgotPasswordDto): Promise<any> {
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
        ]);

        this.mailService.emit(MailEventPattern.sendForgotPassword, {
            to: user.email,
            data: {
                hash,
                tokenExpires,
                returnUrl,
            },
        });
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

        if (!(await this.redisService.existsUniqueKey(key))) {
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

    async updateUser(userJwtPayload: JwtPayloadType, userDto: AuthUpdateDto) {
        const cloneUpdateData: Partial<User> = {
            firstName: userDto.firstName,
            lastName: userDto.lastName,
        };

        if (userDto?.password) {
            if (!userDto.oldPassword) {
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
                userDto.oldPassword,
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

            cloneUpdateData.password = userDto.password;
            delete userDto.password;
            delete userDto.oldPassword;
        }

        if (userDto?.address !== null || userDto?.address !== undefined) {
            if (userDto.address?.length === 0) {
                userDto.address = [];
            } else if (userDto.address && userDto.address?.length > 0) {
                const addressPromises = userDto.address.map((address) =>
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

                const defaultAddresses = userDto.address.filter((address) => address?.isDefault);
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
                    userDto.address[0].isDefault = true;
                }
            }

            cloneUpdateData.address = userDto.address;
            delete userDto.address;
        }

        if (userDto?.avatarImageId) {
            const image: AvatarSchema = await this.imagesService.getImageByPublicId(
                userDto.avatarImageId,
            );
            if (!image) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            avatarImageId: 'invalidImageId',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            cloneUpdateData.avatar = image;
            delete userDto.avatarImageId;
        }

        await this.usersService.update(userJwtPayload.userId, cloneUpdateData);
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
