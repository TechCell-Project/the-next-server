import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Brand, BrandSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class BrandsModule {}
