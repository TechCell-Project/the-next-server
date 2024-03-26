import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Attribute, AttributeSchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Attribute.name, schema: AttributeSchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class AttributesModule {}
