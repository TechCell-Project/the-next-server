export enum OrderStatusEnum {
    Pending = 'pending',
    Confirmed = 'confirmed',
    Preparing = 'preparing',
    Prepared = 'prepared',
    Shipping = 'shipping',
    Canceled = 'canceled',
    Failed = 'failed',
    Completed = 'completed',
}

export enum OrderActionEnum {
    PendingToConfirmed = 'pending-to-confirmed',
    ConfirmedToPreparing = 'confirmed-to-preparing',
    PreparingToPrepared = 'preparing-to-prepared',
    PreparedToShipping = 'prepared-to-shipping',
    ShippingToCompleted = 'shipping-to-completed',

    CancelByCustomer = 'cancel-by-customer',
    FailedBySales = 'failed-by-sales',
    FailedByWarehouse = 'failed-by-warehouse',
    FailedBySystem = 'failed-by-system',
}
