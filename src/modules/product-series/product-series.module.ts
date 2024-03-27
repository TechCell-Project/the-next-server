import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { ProductSeries, ProductSeriesSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: ProductSeries.name, schema: ProductSeriesSchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class ProductSeriesModule {}
