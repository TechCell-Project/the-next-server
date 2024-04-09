import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { SKU, SKUSchema } from './schemas';
import { SkusController } from './skus.controller';

@Module({
    imports: [MongodbModule, MongooseModule.forFeature([{ name: SKU.name, schema: SKUSchema }])],
    controllers: [SkusController],
    // providers: [SPURepository, SPUService],
    // exports: [SPUService],
})
export class SKUModule {}
