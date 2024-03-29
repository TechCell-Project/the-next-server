import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { GMAIL_TRANSPORT, RESEND_TRANSPORT, SENDGRID_TRANSPORT } from './mail.constant';
import { MailerConfig } from './mail.config';
import { I18nContext } from 'nestjs-i18n';
import { I18nTranslations } from '../i18n';
import { MaybeType } from '~/common/types';

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

    // async sendForgotPasswordMail(
    //     { userEmail, firstName, otpCode }: ForgotPasswordEmailDTO,
    //     lang,
    //     transporter?: string,
    //     retryCount = 0,
    // ) {
    //     const i18Context = new I18nContext(lang, this.i18n);
    //     if (retryCount > this.MAX_RETRIES) {
    //         this.logger.debug(`Send mail failed: too many retries`);
    //         return {
    //             message: 'Failed to send email',
    //         };
    //     }

    //     const transporterName = this.resolveTransporter(transporter);
    //     const message = `Mail sent: ${userEmail}`;
    //     this.logger.debug(
    //         `Sending forgot password mail to ${userEmail} with transporter: ${transporterName}`,
    //     );
    //     return this.mailerService
    //         .sendMail({
    //             transporterName,
    //             to: userEmail,
    //             subject: i18Context.t('emailMessage.RESET_PASSWORD_SUBJECT'),
    //             template: 'forgot-password',
    //             context: {
    //                 userEmail,
    //                 firstName,
    //                 otpCode,
    //                 FORGOT_PASSWORD_TEXT_1: i18Context.t('emailMessage.FORGOT_PASSWORD_TEXT_1'),
    //                 YOUR_OTP_CODE_TEXT: i18Context.t('emailMessage.YOUR_OTP_CODE_TEXT'),
    //                 EXPIRED_TIME_OTP_TEXT: i18Context.t('emailMessage.EXPIRED_TIME_OTP_TEXT', {
    //                     args: {
    //                         time: '5',
    //                     },
    //                 }),
    //                 INSTRUCTIONS: i18Context.t('emailMessage.INSTRUCTIONS'),
    //                 INSTRUCTIONS_TEXT_ENTER_OTP_RESET_PASSWORD: i18Context.t(
    //                     'emailMessage.INSTRUCTIONS_TEXT_ENTER_OTP_RESET_PASSWORD',
    //                 ),
    //                 EMAIL_CREDIT: i18Context.t('emailMessage.EMAIL_CREDIT'),
    //             },
    //             attachments: [
    //                 {
    //                     filename: 'logo-red.png',
    //                     path: join(this.TEMPLATES_PATH, 'images/logo-red.png'),
    //                     cid: 'logo_red',
    //                 },
    //             ],
    //         })
    //         .then(() => {
    //             this.logger.debug(`Mail sent: ${userEmail}`);
    //             return {
    //                 message: message,
    //             };
    //         })
    //         .catch(async (error) => {
    //             this.logger.debug(`Send mail failed: ${error.message}`);
    //             transporter = this.getNextTransporter(transporterName);
    //             this.logger.debug(`Retry send mail with transporter: ${transporter}`);
    //             return await this.sendForgotPasswordMail(
    //                 { userEmail, firstName, otpCode },
    //                 lang,
    //                 transporter,
    //                 retryCount + 1,
    //             );
    //         })
    //         .finally(() => {
    //             return {
    //                 message: message,
    //             };
    //         });
    // }

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
