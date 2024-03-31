import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuthProvider, UserRole } from './enums';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './schemas';
import * as bcrypt from 'bcryptjs';
import { NullableType, TPaginationOptions, convertToObjectId, valuesOfEnum } from '~/common';
import { Types } from 'mongoose';
import { FilterUserDto, SortUserDto } from './dtos';

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

        const roleOfUse = valuesOfEnum(UserRole).includes(clonedPayload.role);
        if (!roleOfUse) {
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

        if (clonedPayload.role === UserRole.Manager) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'canNotBeManager',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        if (clonedPayload.role === UserRole.Customer) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'canNotBeCustomer',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const userCreated = await this.usersRepository.create({
            document: clonedPayload,
        });
        return userCreated;
    }

    async findByEmail(email: string): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                email,
            },
        });
        return user ? new User(user) : null;
    }

    async findById(id: string | Types.ObjectId): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
        return user ? new User(user) : null;
    }

    async findBySocial(socialId: string, provider: AuthProvider): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                socialId,
                provider,
            },
        });
        return user ? new User(user) : null;
    }

    async findByUserName(userName: string): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                userName,
            },
        });
        return user ? new User(user) : null;
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
        return user ? new User(user) : null;
    }
    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterUserDto | null;
        sortOptions?: SortUserDto[] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<User[]> {
        return this.usersRepository.findManyWithPagination({
            filterOptions,
            sortOptions,
            paginationOptions,
        });
    }
}
