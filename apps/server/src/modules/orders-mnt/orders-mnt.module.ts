import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Module } from '@nestjs/common';
import { OrdersMntController } from './orders-mnt.controller';
import { CartsModule } from '../carts';
import { SKUModule } from '../skus';
import { UsersModule } from '../users';
import { VnpayModule } from '~/third-party';
import { ProductsModule } from '../products/products.module';
import { RedisModule } from '~/common/redis';
import { OrdersMntService } from './orders-mnt.service';
import { Order, OrderSchema } from '~/server/orders';
import { OrdersRepository } from '../orders/orders.repository';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
        UsersModule,
        SKUModule,
        CartsModule,
        ProductsModule,
        VnpayModule.forRoot({
            vnpayHost: process.env.VNPAY_PAYMENT_URL,
            secureSecret: process.env.VNPAY_SECRET_KEY ?? '',
            tmnCode: process.env.VNPAY_TMN_CODE ?? '',
            testMode: true,
        }),
        RedisModule,
    ],
    controllers: [OrdersMntController],
    providers: [OrdersRepository, OrdersMntService],
    exports: [OrdersMntService],
})
export class OrdersMntModule {}
