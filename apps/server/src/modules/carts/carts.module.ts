import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas';
import { CartsRepository } from './carts.repository';
import { CartsService } from './carts.service';
import { MongodbModule } from '~/common/database/mongodb';
import { RedisModule } from '~/common/redis';
import { CartsController } from './carts.controller';
import { SPUModule } from '../spus';
import { SKUModule } from '../skus';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([
            {
                name: Cart.name,
                schema: CartSchema,
            },
        ]),
        RedisModule,
        ProductsModule,
        SPUModule,
        SKUModule,
    ],
    controllers: [CartsController],
    providers: [CartsRepository, CartsService],
    exports: [CartsService],
})
export class CartsModule {}
