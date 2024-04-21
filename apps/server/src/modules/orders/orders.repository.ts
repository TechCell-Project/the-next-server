import { AbstractRepository, convertToObjectId } from '~/common';
import { Order } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

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
}
