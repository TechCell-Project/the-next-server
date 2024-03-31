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

    changeRole({
        targetUser,
        actor,
        role,
    }: {
        targetUser: User;
        actor: User;
        role: UserRole;
    }): User {
        if (targetUser._id === actor._id) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'cannotChangeRoleOfYourself',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (actor.role !== UserRole.Manager || targetUser.role === UserRole.Manager) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'notAllowedToChangeRole',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (targetUser?.role === role) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        role: 'userAlreadyHasRole',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        targetUser.role = role;
        return targetUser;
    }

    blockUser({
        targetUser,
        actor,
        block: blockObject,
    }: {
        targetUser: User;
        actor: User;
        block: UpdateUserMntDto['block'];
    }): User {
        if (targetUser._id === actor._id) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'cannotBlockYourself',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (actor.role !== UserRole.Manager || targetUser.role === UserRole.Manager) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'notAllowedToBlock',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (targetUser?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'userAlreadyBlocked',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const actLogs = (targetUser.block && targetUser?.block?.activityLogs) || [];
        actLogs.push({
            action: BlockAction.Block,
            actionAt: new Date(),
            actionBy: actor._id,
            reason: blockObject?.activityLogs.reason ?? '',
            note: blockObject?.activityLogs.note ?? '',
        });

        return Object.assign(targetUser, {
            block: {
                isBlocked: true,
                activityLogs: actLogs,
            },
        });
    }

    unblockUser({
        targetUser,
        actor,
        block: blockObject,
    }: {
        targetUser: User;
        actor: User;
        block: UpdateUserMntDto['block'];
    }): User {
        if (targetUser._id === actor._id) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'cannotUnblockYourself',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (actor.role !== UserRole.Manager || targetUser.role === UserRole.Manager) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'notAllowedToUnblock',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (targetUser?.block?.isBlocked) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        block: 'userAlreadyNotBlocked',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const actLogs = (targetUser.block && targetUser?.block?.activityLogs) || [];
        actLogs.push({
            action: BlockAction.Unblock,
            actionAt: new Date(),
            actionBy: actor._id,
            reason: blockObject?.activityLogs.reason ?? '',
            note: blockObject?.activityLogs.note ?? '',
        });

        return Object.assign(targetUser, {
            block: {
                isBlocked: false,
                activityLogs: actLogs,
            },
        });
    }
}
