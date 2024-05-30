import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from '~/common/i18n';
import { LoggerModule } from '~/logger';
import { TaskModule } from './modules/task';
import { ThrottlerModule } from '@nestjs/throttler';
import { NotifyModule } from './modules/notify';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 1000 * 60,
                limit: 1000,
            },
        ]),
        LoggerModule,
        I18nModule,
        MailModule,
        TaskModule,
        NotifyModule,
    ],
})
export class CommunicationModule {}
