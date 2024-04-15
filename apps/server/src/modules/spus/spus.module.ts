import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { SPU, SPUSchema } from './schemas';
import { SPUController } from './spus.controller';
import { SPURepository } from './spus.repository';
import { SpusService } from './spus.service';
import { BrandsModule } from '../brands/brands.module';
import { AttributesModule } from '../attributes';
import { ImagesModule } from '../images';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SPU.name, schema: SPUSchema }]),
        AttributesModule,
        BrandsModule,
        ImagesModule,
    ],
    controllers: [SPUController],
    providers: [SPURepository, SpusService],
    exports: [SpusService],
})
export class SPUModule {}
