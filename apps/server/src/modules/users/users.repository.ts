import { AbstractRepository } from '~/common/abstract';
import { User } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { FilterUserDto, SortUserDto } from './dtos';
import { TPaginationOptions } from '~/common/types';

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
                        [sort.orderBy]: sort.order.toUpperCase() === 'ASC' ? 1 : -1,
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
