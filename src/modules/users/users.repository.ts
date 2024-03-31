import { AbstractRepository } from '~/common/abstract';
import { User } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FilterUserDto, SortUserDto, UpdateUserMntDto } from './dtos';
import { TPaginationOptions } from '~/common/types';
import { BlockAction, UserRole } from './enums';

export class UsersRepository extends AbstractRepository<User> {
    protected readonly logger = new PinoLogger({
        renameContext: UsersRepository.name,
    });

    constructor(
        @InjectModel(User.name) protected readonly userModel: Model<User>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection);
    }

    /**
     *
     * @param createProfileDto
     * @returns
     */
    async validateUserName(userName?: string) {
        let isUserNameExists = null;

        if (!userName) {
            while (!isUserNameExists) {
                const tempUserName = uuid();
                isUserNameExists =
                    (await this.count({
                        filterQuery: {
                            userName: tempUserName,
                        },
                    })) === 0
                        ? tempUserName
                        : null;
            }
        } else {
            isUserNameExists = userName;

            const isExists = await this.count({
                filterQuery: { userName: userName },
            });

            if (isExists) {
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

        return isUserNameExists;
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
        const where: FilterQuery<User> = {};
        if (filterOptions?.roles?.length) {
            where['role'] = {
                $in: filterOptions.roles.map((role) => role.toString()),
            };
        }

        const userObjects = await this.userModel
            .find(where)
            .sort(
                sortOptions?.reduce(
                    (accumulator, sort) => ({
                        ...accumulator,
                        [sort.orderBy === '_id' ? '_id' : sort.orderBy]:
                            sort.order.toUpperCase() === 'ASC' ? 1 : -1,
                    }),
                    {},
                ),
            )
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .limit(paginationOptions.limit)
            .lean(true);

        return userObjects.map((userObject) => new User(userObject));
    }
}
