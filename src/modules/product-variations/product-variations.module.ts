import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { ProductVariation, ProductVariationSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([
            { name: ProductVariation.name, schema: ProductVariationSchema },
        ]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class ProductVariationsModule {}
