import { Module } from '@nestjs/common';
import { LoggerModule } from '~/logger';
import { AppConfigModule } from '~/common/config';
import { RedisModule } from '~/common/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { AuthGoogleModule } from './modules/auth-google';
import { AuthFacebookModule } from './modules/auth-facebook';
import { ProductModelsModule } from './modules/product-models/product-models.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductSeriesModule } from './modules/product-series/product-series.module';
import { ProductVariationsModule } from './modules/product-variations/product-variations.module';

@Module({
    imports: [
        AppConfigModule,
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
