import { AbstractRepository, convertToObjectId, TPaginationOptions } from '~/common';
import { Order } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { FilterOrdersDto, SortOrdersDto } from './dtos';
import { generateRegexQuery } from 'regex-vietnamese';

export class OrdersRepository extends AbstractRepository<Order> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(Order.name) protected readonly orderModel: Model<Order>,
        @InjectConnection() connection: Connection,
    ) {
        super(orderModel, connection);
        this.logger.setContext(OrdersRepository.name);
    }

    async getOrderByIdOrNull(id: Types.ObjectId | string) {
        try {
            const order = await this.findOne({
                filterQuery: {
                    _id: convertToObjectId(id),
                },
            });
            return order;
        } catch (error) {
            return null;
        }
    }

    async findManyWithPagination({
        userId,
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        userId: string;
        filterOptions?: FilterOrdersDto | null;
        sortOptions?: SortOrdersDto[] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Order[]> {
        const where: FilterQuery<Order> = {
            'customer.customerId': convertToObjectId(userId),
        };

        if (filterOptions?.status?.length) {
            where.status = {
                $in: filterOptions.status.map((status) => status.toString()),
            };
        }

        if (filterOptions?.keyword) {
            const keywordRegex = generateRegexQuery(filterOptions.keyword);
            where.$or = [
                { name: keywordRegex },
                { description: keywordRegex },
                { slug: keywordRegex },
                { note: keywordRegex },
                { products: { $elemMatch: { name: keywordRegex } } },
            ];
        }

        const brandObjects = await this.orderModel
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

        return brandObjects.map((userObject) => new Order(userObject));
    }

    async getOrderById(userId: string, orderId: string) {
        return this.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(orderId),
                'customer.customerId': convertToObjectId(userId),
            },
        });
    }
}
