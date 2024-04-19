import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        BullModule.forRoot('redis', {
            redis: {
                host: process.env.REDIS_HOST!,
                port: +process.env.REDIS_PORT!,
                password: process.env.REDIS_PASSWORD!,
            },
        }),
    ],
})
export class BullModuleLib {}
