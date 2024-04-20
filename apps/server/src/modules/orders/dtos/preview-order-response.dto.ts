import { OmitType } from '@nestjs/swagger';
import { Order } from '../schemas';

export class PreviewOrderResponseDto extends OmitType(Order, ['_id', 'note', 'orderStatus']) {
    constructor(data: Omit<PreviewOrderResponseDto, 'totalPrice'>) {
        super();
        Object.assign(this, data);

        this.totalPrice =
            0 +
            this.shipping.fee +
            this.products.reduce((total: number, product) => {
                return (
                    total +
                    (product?.unitPrice?.special || product.unitPrice.base) * product.quantity
                );
            }, 0);
    }
}
