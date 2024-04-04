import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../enum';

export class PaymentSchema {
    @ApiProperty({ example: PaymentMethod.COD, enum: PaymentMethod, type: String })
    @Prop({ required: true, type: String, enum: PaymentMethod, default: PaymentMethod.COD })
    method: string;

    @ApiProperty({ example: PaymentStatus.Pending, enum: PaymentStatus, type: String })
    @Prop({ required: true, type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
    status: string;

    @ApiPropertyOptional({ example: 'https://vnpay.com/pay', type: String })
    @Prop({ required: false, type: String, default: '' })
    url: string;
}
