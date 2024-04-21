import { Inject, Injectable, Logger } from '@nestjs/common';
import { VNPay, VNPayConfig, ReturnQueryFromVNPay, QueryDr, BuildPaymentUrl } from 'vnpay';

@Injectable()
export class VnpayService {
    private readonly logger = new Logger(VnpayService.name);
    private readonly vnpayInstance: VNPay;

    constructor(@Inject('VNPAY_INIT_OPTIONS') private readonly config: VNPayConfig) {
        this.vnpayInstance = new VNPay(this.config);
    }

    createPaymentUrl(data: BuildPaymentUrl) {
        return this.vnpayInstance.buildPaymentUrl(data);
    }

    verifyReturnUrl(query: ReturnQueryFromVNPay) {
        try {
            const isValid = this.vnpayInstance.verifyReturnUrl(query);
            return isValid;
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }

    verifyIpnCall(query: ReturnQueryFromVNPay) {
        try {
            const isValid = this.vnpayInstance.verifyIpnCall(query);
            return isValid;
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }

    async queryDr(data: QueryDr) {
        try {
            const result = await this.vnpayInstance.queryDr(data);
            return result;
        } catch (error) {
            this.logger.error(error);
            return null;
        }
    }
}
