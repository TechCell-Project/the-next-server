import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingProviderEnum } from '../enum';
import { LogSchema } from './log.schema';

export class ShippingSchema {
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

    @ApiPropertyOptional({ example: [], type: [LogSchema] })
    @Prop({ required: false, type: [LogSchema], default: [] })
    logs: LogSchema[];
}
