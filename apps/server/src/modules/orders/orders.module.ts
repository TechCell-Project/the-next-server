import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Order, OrderSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class OrdersModule {}
