import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum, PaymentStatusEnum } from '../enum';

export class PaymentSchema {
    @ApiProperty({ example: PaymentMethodEnum.COD, enum: PaymentMethodEnum, type: String })
    @Prop({ required: true, type: String, enum: PaymentMethodEnum, default: PaymentMethodEnum.COD })
    method: string;

    @ApiProperty({ example: PaymentStatusEnum.Pending, enum: PaymentStatusEnum, type: String })
    @Prop({
        required: true,
        type: String,
        enum: PaymentStatusEnum,
        default: PaymentStatusEnum.Pending,
    })
    status: string;

    @ApiPropertyOptional({ example: 'https://vnpay.com/pay', type: String })
    @Prop({ required: false, type: String, default: '' })
    url: string;
}
