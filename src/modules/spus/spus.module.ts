import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { SPU, SPUSchema } from './schemas';
import { SPUController } from './spus.controller';
import { SPURepository } from './spus.repository';
import { SPUService } from './spus.service';
import { BrandsModule } from '../brands/brands.module';
import { AttributesModule } from '../attributes';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SPU.name, schema: SPUSchema }]),
        AttributesModule,
        BrandsModule,
    ],
    controllers: [SPUController],
    providers: [SPURepository, SPUService],
    exports: [SPUService],
})
export class SPUModule {}
