export enum PaymentMethodEnum {
    COD = 'COD',
    VNPAY = 'VNPAY',

    /**
     * Vietnam bank
     */
    VNBANK = 'VNBANK',

    /**
     * International card
     */
    INTCARD = 'INTCARD',
}

export enum PaymentStatusEnum {
    Pending = 'pending',
    Processing = 'processing',
    WaitForPayment = 'wait-for-payment',
    Completed = 'completed',
    Canceled = 'canceled',
    Failed = 'failed',
}
