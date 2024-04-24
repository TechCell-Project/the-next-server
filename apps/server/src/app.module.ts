import { Module } from '@nestjs/common';
import { LoggerModule } from '~/logger';
import { AppConfigModule } from '~/common/config';
import { I18nModule } from '~/common/i18n';
import { RedisModule } from '~/common/redis';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '~/server/users';
import { AuthModule } from '~/server/auth';
import { AuthGoogleModule } from '~/server/auth-google';
import { AuthFacebookModule } from '~/server/auth-facebook';
import { AttributesModule } from '~/server/attributes';
import { BrandsModule } from '~/server/brands';
import { TagsModule } from '~/server/tags';
import { OrdersModule } from '~/server/orders';
import { SPUModule } from '~/server/spus';
import { AddressModule } from '~/server/address';
import { ImagesModule } from '~/server/images';
import { SKUModule } from '~/server/skus';
import { ProductsModule } from '~/server/products';
import { CartsModule } from '~/server/carts';
import { OrdersMntModule } from '~/server/orders-mnt';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
    imports: [
        AppConfigModule,
        I18nModule,
        RedisModule,
        BullModule.forRoot('redis', {
            connection: {
                host: process.env.REDIS_HOST,
                port: +process.env.REDIS_PORT!,
                password: process.env.REDIS_PASSWORD,
            },
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 1000 * 60,
                limit: 1000,
            },
        ]),
        LoggerModule,
        AuthModule,
        AttributesModule,
        AuthGoogleModule,
        AuthFacebookModule,
        UsersModule,
        ImagesModule,
        AddressModule,
        BrandsModule,
        AttributesModule,
        TagsModule,
        SPUModule,
        SKUModule,
        ProductsModule,
        CartsModule,
        OrdersModule,
        OrdersMntModule,
    ],
})
export class AppModule {}
