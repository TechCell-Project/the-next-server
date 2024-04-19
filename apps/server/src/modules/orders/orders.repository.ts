import { AbstractRepository } from '~/common';
import { Order } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { Connection, Model } from 'mongoose';
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
}
