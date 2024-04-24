import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingProviderEnum } from '../enum';
import { OrderLogSchema } from './order-log.schema';

export class ShippingSchema {
    @ApiProperty({ example: '123', type: String })
    @Prop({ required: true, type: String })
    orderShipCode: string;

    @ApiProperty({ example: ShippingProviderEnum.GHN, enum: ShippingProviderEnum, type: String })
    @Prop({
        required: true,
        type: String,
        enum: ShippingProviderEnum,
        default: ShippingProviderEnum.GHN,
    })
    provider: string;

    @ApiProperty({ example: 15000, type: Number })
    @Prop({ required: true, type: Number, default: 0 })
    fee: number;

    @ApiProperty({ example: new Date(), type: Date })
    @Prop({ required: true, type: Date })
    expectedDeliveryTime: Date;

    @ApiProperty({ example: 'https://tracking.ghn.dev/?order_code=LF9WF3', type: String })
    @Prop({ required: true, type: String })
    trackingLink: string;

    @ApiPropertyOptional({ example: [], type: [OrderLogSchema] })
    @Prop({ required: false, type: [OrderLogSchema], default: [] })
    logs: OrderLogSchema[];
}
