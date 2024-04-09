import { Module } from '@nestjs/common';
import { LoggerModule } from '~/logger';
import { AppConfigModule } from '~/common/config';
import { RedisModule } from '~/common/redis';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { AuthGoogleModule } from './modules/auth-google';
import { AuthFacebookModule } from './modules/auth-facebook';
import { ProductModelsModule } from './modules/product-models/product-models.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductSeriesModule } from './modules/product-series/product-series.module';
import { ProductVariationsModule } from './modules/product-variations/product-variations.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SPUModule } from './modules/spus';
import { AddressModule } from './modules/address';
import { ImagesModule } from './modules/images';
import { I18nModule } from '~/common/i18n';
import { SKUModule } from './modules/skus';

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
        ProductModelsModule,
        AttributesModule,
        ProductSeriesModule,
        ProductVariationsModule,
        CategoriesModule,
        OrdersModule,
        SPUModule,
        SKUModule,
    ],
})
export class AppModule {}
