import { Type } from 'class-transformer';
import { ReturnQueryFromVNPay } from 'vnpay';

export class VnpayIpnUrlDTO implements ReturnQueryFromVNPay {
    @Type(() => Number)
    vnp_Amount: number;

    @Type(() => String)
    vnp_BankCode: string;

    @Type(() => String)
    vnp_BankTranNo: string;

    @Type(() => String)
    vnp_CardType: string;

    @Type(() => String)
    vnp_OrderInfo: string;

    @Type(() => Number)
    vnp_PayDate: number;

    @Type(() => String)
    vnp_ResponseCode: string;

    @Type(() => String)
    vnp_TmnCode: string;

    @Type(() => Number)
    vnp_TransactionNo: number;

    @Type(() => String)
    vnp_TransactionStatus: string;

    @Type(() => String)
    vnp_TxnRef: string;

    @Type(() => String)
    vnp_SecureHash: string;
}
