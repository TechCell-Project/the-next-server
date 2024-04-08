import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from '~/common/i18n';
import { LoggerModule } from '~/logger';
import { RabbitMQModule } from '~/common/rabbitmq';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        RabbitMQModule.registerRmq('COMMUNICATION_SERVICE', process.env.COMMUNICATION_QUEUE!),
        LoggerModule,
        I18nModule,
        MailModule,
    ],
})
export class CommunicationModule {}
