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
import { I18nModule } from './modules/i18n';
import { MailModule } from '~/modules/mail';

@Module({
    imports: [
        AppConfigModule,
        I18nModule,
        MailModule,
        RedisModule,
        LoggerModule,
        AuthModule,
        AuthGoogleModule,
        AuthFacebookModule,
        UsersModule,
        BrandsModule,
        ProductModelsModule,
        AttributesModule,
        ProductSeriesModule,
        ProductVariationsModule,
        CategoriesModule,
        OrdersModule,
    ],
})
export class AppModule {}
