import { Module } from '@nestjs/common';
import { RabbitMQModule } from '~/common/rabbitmq';
import { CloudinaryModule } from '~/third-party/cloudinary.com';
import { ImageTaskService } from './image-task.service';
import { UsersModule } from '~/server/users';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        CloudinaryModule,
        UsersModule,
        RabbitMQModule.registerRmq('SERVER_SERVICE', process.env.SERVER_QUEUE ?? 'SERVER_QUEUE'),
    ],
    providers: [ImageTaskService],
    exports: [ImageTaskService],
})
export class ImageTaskModule {}
