import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { SKU, SKUSchema } from './schemas';
import { SkusController } from './skus.controller';
import { SkusRepository } from './skus.repository';
import { SkusService } from './skus.service';
import { SPUModule } from '../spus';
import { ImagesModule } from '../images';
import { AttributesModule } from '../attributes';
import { SerialNumber, SerialNumberSchema } from './schemas/serial-number.schema';
import { SerialNumberRepository } from './serial-number.repository';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SKU.name, schema: SKUSchema }]),
        MongooseModule.forFeature([{ name: SerialNumber.name, schema: SerialNumberSchema }]),
        SPUModule,
        ImagesModule,
        AttributesModule,
    ],
    controllers: [SkusController],
    providers: [SkusRepository, SkusService, SerialNumberRepository],
    exports: [SkusService],
})
export class SKUModule {}
