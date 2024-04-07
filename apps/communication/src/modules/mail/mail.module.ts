import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerConfig } from './mail.config';
import { I18nModule } from '~/common/i18n';

@Module({
    imports: [
        I18nModule,
        MailerModule.forRootAsync({
            useClass: MailerConfig,
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
