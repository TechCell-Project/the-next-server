import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { ProductModel, ProductModelSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: ProductModel.name, schema: ProductModelSchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class ProductModelsModule {}
