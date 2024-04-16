import { Module } from '@nestjs/common';
import { LoggerModule } from '~/logger';
import { AppConfigModule } from '~/common/config';
import { RedisModule } from '~/common/redis';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { AuthGoogleModule } from './modules/auth-google';
import { AuthFacebookModule } from './modules/auth-facebook';
import { AttributesModule } from './modules/attributes/attributes.module';
import { BrandsModule } from './modules/brands/brands.module';
import { TagsModule } from './modules/tags/tags.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SPUModule } from './modules/spus';
import { AddressModule } from './modules/address';
import { ImagesModule } from './modules/images';
import { I18nModule } from '~/common/i18n';
import { SKUModule } from './modules/skus';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts';

@Module({
    imports: [
        AppConfigModule,
        I18nModule,
        RedisModule,
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
        OrdersModule,
        SPUModule,
        SKUModule,
        ProductsModule,
        CartsModule,
    ],
})
export class AppModule {}
