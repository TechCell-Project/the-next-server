import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from '~/common/i18n';
import { LoggerModule } from '~/logger';
import { TaskModule } from './modules/task';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule,
        I18nModule,
        MailModule,
        TaskModule,
    ],
})
export class CommunicationModule {}
