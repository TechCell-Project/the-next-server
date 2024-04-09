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

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SKU.name, schema: SKUSchema }]),
        SPUModule,
        ImagesModule,
        AttributesModule,
    ],
    controllers: [SkusController],
    providers: [SkusRepository, SkusService],
    exports: [SkusService],
})
export class SKUModule {}
