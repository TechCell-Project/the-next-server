export const MailEventPattern = {
    sendConfirmMail: { emit: 'mail.sendConfirmMail' },
    sendForgotPassword: { emit: 'mail.sendForgotPassword' },
} as const;
