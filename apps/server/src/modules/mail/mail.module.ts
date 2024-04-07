import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerConfig } from './mail.config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            useClass: MailerConfig,
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
