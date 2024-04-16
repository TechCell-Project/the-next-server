import { Module } from '@nestjs/common';
import { BrandsModule } from '../brands/brands.module';
import { TagsModule } from '../tags';
import { SPUModule } from '../spus';
import { SKUModule } from '../skus';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { RedisModule } from '~/common/redis';

@Module({
    imports: [RedisModule, BrandsModule, TagsModule, SPUModule, SKUModule],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule {}
