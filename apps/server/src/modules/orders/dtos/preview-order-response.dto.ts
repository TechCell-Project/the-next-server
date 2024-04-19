import { OmitType } from '@nestjs/swagger';
import { Order } from '../schemas';

export class PreviewOrderResponseDto extends OmitType(Order, ['_id', 'note', 'orderStatus']) {
    constructor(data: PreviewOrderResponseDto) {
        super();
        Object.assign(this, data);
    }
}
