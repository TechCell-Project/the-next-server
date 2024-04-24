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
import { RedisModule } from '~/common/redis';
import { RabbitMQService } from '~/common/rabbitmq';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SPU.name, schema: SPUSchema }]),
        AttributesModule,
        BrandsModule,
        ImagesModule,
        RedisModule,
    ],
    controllers: [SPUController],
    providers: [SPURepository, SpusService, RabbitMQService],
    exports: [SpusService],
})
export class SPUModule {}
