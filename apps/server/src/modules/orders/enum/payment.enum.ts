export enum PaymentMethodEnum {
    COD = 'cod',
    VNPAY = 'vnpay',
    ATM = 'atm',
    VISA = 'visa',
    MASTERCARD = 'mastercard',
    JCB = 'jcb',
}

export enum PaymentStatusEnum {
    Pending = 'pending',
    Processing = 'processing',
    WaitForPayment = 'wait-for-payment',
    Completed = 'completed',
    Canceled = 'canceled',
    Failed = 'failed',
}
