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

        const userCreated = await this.usersRepository.create({
            document: clonedPayload,
        });
        return new User(userCreated);
    }

    async findByEmail(email: string): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                email,
            },
        });
        return new User(user);
    }

    async findById(id: string | Types.ObjectId): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
        return new User(user);
    }

    async findBySocial(socialId: string, provider: AuthProvider): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                socialId,
                provider,
            },
        });
        return new User(user);
    }

    async update(
        userId: string | Types.ObjectId,
        payload: Partial<User>,
    ): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...payload,
            },
        });
        return new User(user);
    }
}
