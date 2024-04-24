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
import { BullModule } from '@nestjs/bullmq';
import { ReleaseHoldSerialNumberConsumer } from './queues/release-hold-sku.consumer';
import { RELEASE_HOLD_SERIAL_NUMBER_QUEUE } from './constants/skus-queue.constant';
import { RedisModule } from '~/common/redis';
import { RabbitMQService } from '~/common/rabbitmq';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: SKU.name, schema: SKUSchema }]),
        MongooseModule.forFeature([{ name: SerialNumber.name, schema: SerialNumberSchema }]),
        SPUModule,
        ImagesModule,
        AttributesModule,
        BullModule.registerQueue({
            configKey: 'redis',
            prefix: `BULLMQ_${RELEASE_HOLD_SERIAL_NUMBER_QUEUE}:`,
            name: RELEASE_HOLD_SERIAL_NUMBER_QUEUE,
        }),
        RedisModule,
    ],
    controllers: [SkusController],
    providers: [
        SkusRepository,
        SkusService,
        SerialNumberRepository,
        ReleaseHoldSerialNumberConsumer,
        RabbitMQService,
    ],
    exports: [SkusService],
})
export class SKUModule {}
