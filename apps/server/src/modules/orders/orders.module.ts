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
import { GhnModule } from '~/third-party';
import { ProductsModule } from '../products/products.module';

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
    ],
    controllers: [OrdersController],
    providers: [OrdersRepository, OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}
