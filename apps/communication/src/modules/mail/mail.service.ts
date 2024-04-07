import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { GMAIL_TRANSPORT, RESEND_TRANSPORT, SENDGRID_TRANSPORT } from './mail.constant';
import { MailerConfig } from './mail.config';
import { I18nContext } from 'nestjs-i18n';
import { MaybeType } from '~/common/types';
import { MailData } from './mail-data.interface';
import { I18nTranslations } from '~/common/i18n';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {
        const mailConfig = new MailerConfig();
        this.mailerService.addTransporter(SENDGRID_TRANSPORT, mailConfig.SendGridTransport);
        this.mailerService.addTransporter(RESEND_TRANSPORT, mailConfig.ResendTransport);
        this.mailerService.addTransporter(GMAIL_TRANSPORT, mailConfig.GmailTransport);
    }

    private readonly logger = new Logger(MailService.name);
    private readonly TRANSPORTERS = [SENDGRID_TRANSPORT, RESEND_TRANSPORT, GMAIL_TRANSPORT];
    private readonly MAX_RETRIES = this.TRANSPORTERS.length;

    async sendMail(email: string, name: string, transporter?: string, retryCount = 0) {
        if (retryCount > this.MAX_RETRIES) {
            this.logger.error(`Send mail failed: too many retries`);
            return {
                message: 'Failed to send email',
            };
        }

        const transporterName = this.resolveTransporter(transporter);
        return await this.mailerService
            .sendMail({
                transporterName,
                to: email,
                subject: 'Greeting from NestJS NodeMailer',
                template: 'test',
                context: {
                    name: name,
                },
            })
            .then(() => {
                this.logger.log(`Mail sent:: ${email}`);
                return {
                    message:
                        'Your registration was successfully, please check your email to verify your registration',
                };
            })
            .catch((error): unknown => {
                this.logger.error(`Send mail failed: ${error.message}`);

                transporter = this.getNextTransporter(transporterName) ?? GMAIL_TRANSPORT;
                this.logger.log(`Retry send mail with transporter: ${transporter}`);
                return this.sendMail(email, name, transporter, retryCount + 1);
            });
    }

    async sendConfirmMail(data: {
        to: string;
        retryCount?: number;
        isResend?: boolean;
        mailData: {
            hash: string;
        };
        transporter?: string;
    }) {
        const { to, retryCount = 0, isResend = false, mailData } = data;
        let { transporter = SENDGRID_TRANSPORT } = data;

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
                await this.sendConfirmMail({
                    to: to,
                    transporter,
                    retryCount: retryCount + 1,
                    mailData,
                });
            })
            .finally(() => {
                return;
            });
    }

    async forgotPassword(
        mailData: MailData<{ hash: string; tokenExpires: number; returnUrl?: string }>,
        retryData: {
            retryCount?: number;
            transporter?: string;
        } = { retryCount: 0, transporter: SENDGRID_TRANSPORT },
    ) {
        const { retryCount = 0, transporter = SENDGRID_TRANSPORT } = retryData;

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
        const fallbackReturnUrl = process.env.FE_DOMAIN + '/password-change';

        const url = new URL(mailData?.data?.returnUrl ?? fallbackReturnUrl);
        url.searchParams.set('expires', mailData.data.tokenExpires.toString());
        url.searchParams.set('hash', mailData.data.hash);

        let transporterName = this.resolveTransporter(transporter);
        await this.mailerService
            .sendMail({
                to: mailData.to,
                subject: resetPasswordTitle,
                text: `${url.toString()} ${resetPasswordTitle}`,
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
                this.logger.debug(`Mail sent: ${mailData.to}`);
            })
            .catch(async (error) => {
                this.logger.debug(`Send mail failed: ${error.message}`);
                transporterName = this.getNextTransporter(transporterName);
                this.logger.debug(`Retry send mail with transporter: ${transporterName}`);
                await this.forgotPassword(mailData, {
                    transporter: transporterName,
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
