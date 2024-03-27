export enum PaymentMethod {
    COD = 'cod',
    VNPAY = 'vnpay',
    ATM = 'atm',
    VISA = 'visa',
    MASTERCARD = 'mastercard',
    JCB = 'jcb',
}

export enum PaymentStatus {
    Pending = 'pending',
    Processing = 'processing',
    WaitForPayment = 'wait-for-payment',
    Completed = 'completed',
    Canceled = 'canceled',
    Failed = 'failed',
}
