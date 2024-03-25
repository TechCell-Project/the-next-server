import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuthProvider, UserRole } from './enums';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './schemas';
import * as bcrypt from 'bcryptjs';
import { NullableType, convertToObjectId, valuesOfEnum } from '~/common';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
    constructor(public readonly usersRepository: UsersRepository) {}

    async create(createProfileDto: CreateUserDto): Promise<User> {
        const clonedPayload = {
            provider: AuthProvider.Email,
            emailVerified: false,
            userName: await this.usersRepository.validateUserName(createProfileDto?.userName),
            ...createProfileDto,
        };

        if (clonedPayload.password) {
            const salt = await bcrypt.genSalt();
            clonedPayload.password = await bcrypt.hash(clonedPayload.password, salt);
        }

        if (clonedPayload.email) {
            const userObject = await this.usersRepository.findOne({
                filterQuery: {
                    email: clonedPayload.email,
                },
            });
            if (userObject) {
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
        }

        // if (clonedPayload.photo?.id) {
        //     const fileObject = await this.filesService.findOne({
        //         id: clonedPayload.photo.id,
        //     });
        //     if (!fileObject) {
        //         throw new HttpException(
        //             {
        //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
        //                 errors: {
        //                     photo: 'imageNotExists',
        //                 },
        //             },
        //             HttpStatus.UNPROCESSABLE_ENTITY,
        //         );
        //     }
        //     clonedPayload.photo = fileObject;
        // }

        const roleObject = valuesOfEnum(UserRole).includes(clonedPayload.role);
        if (!roleObject) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'roleNotExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        // if (clonedPayload.status?.id) {
        //     const statusObject = Object.values(StatusEnum).includes(clonedPayload.status.id);
        //     if (!statusObject) {
        //         throw new HttpException(
        //             {
        //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
        //                 errors: {
        //                     status: 'statusNotExists',
        //                 },
        //             },
        //             HttpStatus.UNPROCESSABLE_ENTITY,
        //         );
        //     }
        // }

        return this.usersRepository.create({
            document: clonedPayload,
        });
    }

    async findByEmail(email: string): Promise<NullableType<User>> {
        return this.usersRepository.findOne({
            filterQuery: {
                email,
            },
        });
    }

    async findById(id: string | Types.ObjectId): Promise<NullableType<User>> {
        return this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
    }

    async findBySocial(socialId: string, provider: AuthProvider): Promise<NullableType<User>> {
        return this.usersRepository.findOne({
            filterQuery: {
                socialId,
                provider,
            },
        });
    }

    async update(
        userId: string | Types.ObjectId,
        payload: Partial<User>,
    ): Promise<NullableType<User>> {
        return this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...payload,
            },
        });
    }
}
