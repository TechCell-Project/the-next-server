import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerConfig } from './mail.config';
import { I18nModule } from '~/common/i18n';
import { MailController } from './mail.controller';
import { RabbitMQService } from '~/common';

@Module({
    imports: [
        I18nModule,
        MailerModule.forRootAsync({
            useClass: MailerConfig,
        }),
    ],
    controllers: [MailController],
    providers: [MailService, RabbitMQService],
    exports: [MailService],
})
export class MailModule {}
