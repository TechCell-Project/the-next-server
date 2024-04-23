import { AbstractRepository, convertToObjectId, TPaginationOptions } from '~/common';
import { PinoLogger } from 'nestjs-pino';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { SortOrdersMntDto } from './dtos';
import { RedlockService } from '~/common/redis';
import { Order } from '~/server/orders';

export class OrdersMntRepository extends AbstractRepository<Order> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(Order.name) protected readonly orderModel: Model<Order>,
        @InjectConnection() connection: Connection,
        private readonly redlockService: RedlockService,
    ) {
        super(orderModel, connection);
        this.logger.setContext(OrdersMntRepository.name);
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

    async findManyWithPaginationMnt({
        filterQuery,
        sortOptions,
        paginationOptions,
    }: {
        filterQuery: FilterQuery<Order>;
        sortOptions?: SortOrdersMntDto[] | null;
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
}
