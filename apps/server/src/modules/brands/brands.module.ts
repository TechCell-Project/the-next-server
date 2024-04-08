import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Brand, BrandSchema } from './schemas';
import { Module } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    ],
    controllers: [BrandsController],
    providers: [BrandsRepository, BrandsService],
    exports: [BrandsService],
})
export class BrandsModule {}
