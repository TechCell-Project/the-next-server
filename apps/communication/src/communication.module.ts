import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from '~/common/i18n';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        I18nModule,
        MailModule,
    ],
})
export class CommunicationModule {}
