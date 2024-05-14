import { AbstractRepository, convertToObjectId, TPaginationOptions } from '~/common';
import { Order } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import {
    ClientSession,
    Connection,
    FilterQuery,
    Model,
    QueryOptions,
    Types,
    UpdateQuery,
} from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { FilterOrdersDto, SortOrdersDto } from './dtos';
import { generateRegexQuery } from 'regex-vietnamese';
import { RedlockService } from '~/common/redis';
import { ExecutionError, Lock } from 'redlock';
import { HttpException, HttpStatus } from '@nestjs/common';

export class OrdersRepository extends AbstractRepository<Order> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(Order.name) protected readonly orderModel: Model<Order>,
        @InjectConnection() connection: Connection,
        private readonly redlockService: RedlockService,
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
        customerId,
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        customerId: string;
        filterOptions?: FilterOrdersDto | null;
        sortOptions?: SortOrdersDto[] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Order[]> {
        const where: FilterQuery<Order> = {
            'customer.customerId': convertToObjectId(customerId),
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

        const orders = await this.orderModel
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

        return orders.map((od) => new Order(od));
    }

    async findManyWithPaginationMnt({
        filterQuery,
        sortOptions,
        paginationOptions,
    }: {
        filterQuery: FilterQuery<Order>;
        sortOptions?: SortOrdersDto[] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Order[]> {
        console.log(filterQuery);
        const orderObjects = await this.orderModel
            .find(filterQuery)
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

        return orderObjects.map((order) => new Order(order));
    }

    async getOrderById(userId: string, orderId: string) {
        return this.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(orderId),
                'customer.customerId': convertToObjectId(userId),
            },
        });
    }

    async updateOrderById({
        orderId,
        updateQuery,
        queryOptions,
        session,
    }: {
        orderId: Order['_id'];
        updateQuery: UpdateQuery<Order>;
        queryOptions?: Partial<QueryOptions<Order>>;
        session?: ClientSession;
    }) {
        let lock: Lock | null = null;
        try {
            lock = await this.redlockService.lock([`order:update:${orderId.toString()}`], 5000);
            const res = await this.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: convertToObjectId(orderId),
                },
                updateQuery,
                queryOptions,
                session,
            });
            return res;
        } catch (error) {
            if (error instanceof ExecutionError) {
                throw new HttpException(
                    {
                        status: HttpStatus.CONFLICT,
                        errors: {
                            order: 'orderInUpdating',
                        },
                    },
                    HttpStatus.CONFLICT,
                );
            }
            throw error;
        } finally {
            if (lock) {
                await this.redlockService.unlock(lock);
            }
        }
    }
}
