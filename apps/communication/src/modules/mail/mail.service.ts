import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { GMAIL_TRANSPORT, RESEND_TRANSPORT, SENDGRID_TRANSPORT } from './mail.constant';
import { MailerConfig } from './mail.config';
import { I18nContext } from 'nestjs-i18n';
import { MaybeType } from '~/common/types';
import { MailData } from './mail-data.interface';
import { I18nTranslations } from '~/common/i18n';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MailService {
    constructor(
        private mailerService: MailerService,
        private readonly logger: PinoLogger,
    ) {
        const mailConfig = new MailerConfig();
        this.mailerService.addTransporter(SENDGRID_TRANSPORT, mailConfig.SendGridTransport);
        this.mailerService.addTransporter(RESEND_TRANSPORT, mailConfig.ResendTransport);
        this.mailerService.addTransporter(GMAIL_TRANSPORT, mailConfig.GmailTransport);

        this.logger.setContext(MailService.name);
    }

    private readonly TRANSPORTERS = [SENDGRID_TRANSPORT, RESEND_TRANSPORT, GMAIL_TRANSPORT];
    private readonly MAX_RETRIES = this.TRANSPORTERS.length;

    async sendConfirmMail(
        data: {
            to: string;
            mailData: {
                hash: string;
            };
            isResend?: boolean;
        },
        retryData: {
            retryCount?: number;
            transporter?: string;
        } = { retryCount: 0, transporter: SENDGRID_TRANSPORT },
    ): Promise<unknown> {
        const { to, isResend = false, mailData } = data;

        let { transporter = SENDGRID_TRANSPORT } = retryData;
        const { retryCount = 0 } = retryData;

        const i18n = I18nContext.current<I18nTranslations>();
        let emailConfirmTitle: MaybeType<string>;
        let text1: MaybeType<string>;
        let text2: MaybeType<string>;
        let text3: MaybeType<string>;
        let btn1: MaybeType<string>;

        if (retryCount > this.MAX_RETRIES) {
            this.logger.debug(`Send mail failed: too many retries`);
            return {
                message: 'Failed to send email',
            };
        }

        if (i18n) {
            if (!isResend) {
                emailConfirmTitle = i18n.t('mail-context.CONFIRM_EMAIL.title');
                text1 = i18n.t('mail-context.CONFIRM_EMAIL.text1');
                text2 = i18n.t('mail-context.CONFIRM_EMAIL.text2');
                text3 = i18n.t('mail-context.CONFIRM_EMAIL.text3');
                btn1 = i18n.t('mail-context.CONFIRM_EMAIL.btn1');
            } else {
                emailConfirmTitle = i18n.t('mail-context.RESEND_CONFIRM_EMAIL.title');
                text1 = i18n.t('mail-context.RESEND_CONFIRM_EMAIL.text1');
                text2 = i18n.t('mail-context.RESEND_CONFIRM_EMAIL.text2');
                text3 = i18n.t('mail-context.RESEND_CONFIRM_EMAIL.text3');
                btn1 = i18n.t('mail-context.RESEND_CONFIRM_EMAIL.btn1');
            }
        }

        const url = new URL(process.env.FE_DOMAIN + '/confirm-email');
        url.searchParams.set('hash', mailData.hash);

        const transporterName = this.resolveTransporter(transporter);
        this.logger.debug(`Sending confirm mail to ${to} with transporter: ${transporterName}`);
        return this.mailerService
            .sendMail({
                transporterName,
                to: to,
                subject: emailConfirmTitle,
                template: 'confirm-email',
                context: {
                    title: emailConfirmTitle,
                    url: url.toString(),
                    app_name: 'TechCell.cloud',
                    text1,
                    text2,
                    text3,
                    btn1,
                },
            })
            .then(() => {
                this.logger.debug(`Mail sent: ${to}`);
            })
            .catch(async (error) => {
                this.logger.debug(`Send mail failed: ${error.message}`);
                transporter = this.getNextTransporter(transporterName);
                this.logger.debug(`Retry send mail with transporter: ${transporter}`);
                await this.sendConfirmMail(
                    {
                        to: to,
                        mailData,
                    },
                    {
                        transporter,
                        retryCount: retryCount + 1,
                    },
                );
            });
    }

    async sendForgotPassword(
        mailData: MailData<{ hash: string; tokenExpires: number; returnUrl?: string }>,
        retryData: {
            retryCount?: number;
            transporter?: string;
        } = { retryCount: 0, transporter: SENDGRID_TRANSPORT },
    ) {
        const { to, data } = mailData;

        let { transporter = SENDGRID_TRANSPORT } = retryData;
        const { retryCount = 0 } = retryData;

        if (retryCount > this.MAX_RETRIES) {
            this.logger.debug(`Send mail failed: too many retries`);
            return {
                message: 'Failed to send email',
            };
        }

        const i18n = I18nContext.current<I18nTranslations>();
        let resetPasswordTitle: MaybeType<string>;
        let text1: MaybeType<string>;
        let text2: MaybeType<string>;
        let text3: MaybeType<string>;
        let text4: MaybeType<string>;

        if (i18n) {
            [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
                i18n.t('mail-context.RESET_PASSWORD.title'),
                i18n.t('mail-context.RESET_PASSWORD.text1'),
                i18n.t('mail-context.RESET_PASSWORD.text2'),
                i18n.t('mail-context.RESET_PASSWORD.text3'),
                i18n.t('mail-context.RESET_PASSWORD.text4'),
            ]);
        }
        const fallbackReturnUrl = process.env.FE_DOMAIN ?? '' + '/password-change';

        const url = new URL(data?.returnUrl ?? fallbackReturnUrl);
        url.searchParams.set('expires', data.tokenExpires.toString());
        url.searchParams.set('hash', data.hash);

        const transporterName = this.resolveTransporter(transporter);
        this.logger.debug(`Sending forgot mail to ${to} with transporter: ${transporterName}`);
        await this.mailerService
            .sendMail({
                transporterName,
                to: to,
                subject: resetPasswordTitle,
                template: 'reset-password',
                context: {
                    title: resetPasswordTitle,
                    url: url.toString(),
                    actionTitle: resetPasswordTitle,
                    app_name: 'TechCell.cloud',
                    text1,
                    text2,
                    text3,
                    text4,
                },
            })
            .then(() => {
                this.logger.debug(`Mail sent: ${to}`);
            })
            .catch(async (error) => {
                this.logger.debug(`Send mail failed: ${error.message}`);
                transporter = this.getNextTransporter(transporterName);
                this.logger.debug(`Retry send mail with transporter: ${transporter}`);
                await this.sendForgotPassword(mailData, {
                    transporter: transporter,
                    retryCount: retryCount + 1,
                });
            });
    }

    private resolveTransporter(transporter = SENDGRID_TRANSPORT) {
        if (!this.TRANSPORTERS.includes(transporter)) {
            transporter = SENDGRID_TRANSPORT;
        }

        return transporter;
    }

    private getNextTransporter(currentTransporter: string): string {
        const currentIndex = this.TRANSPORTERS.indexOf(currentTransporter);
        if (currentIndex === -1 || currentIndex === this.TRANSPORTERS.length - 1) {
            return this.TRANSPORTERS[0];
        } else {
            return this.TRANSPORTERS[currentIndex + 1];
        }
    }
}
