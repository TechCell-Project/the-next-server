import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Attribute, AttributeSchema } from './schemas';
import { Module } from '@nestjs/common';
import { AttributesController } from './attributes.controller';
import { AttributesRepository } from './attributes.repository';
import { AttributesService } from './attributes.service';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Attribute.name, schema: AttributeSchema }]),
    ],
    controllers: [AttributesController],
    providers: [AttributesRepository, AttributesService],
    exports: [AttributesService],
})
export class AttributesModule {}
