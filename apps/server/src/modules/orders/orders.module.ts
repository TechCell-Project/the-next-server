import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Order, OrderSchema } from './schemas';
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { CartsModule } from '../carts';
import { SKUModule } from '../skus';
import { UsersModule } from '../users';
import { GhnModule, VnpayModule } from '~/third-party';
import { ProductsModule } from '../products/products.module';
import { RedisModule } from '~/common/redis';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
        GhnModule.forRoot({
            host: process.env.GHN_URL!,
            token: process.env.GHN_API_TOKEN!,
            shopId: +process.env.GHN_SHOP_ID!,
            testMode: true,
        }),
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
    controllers: [OrdersController],
    providers: [OrdersRepository, OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}
