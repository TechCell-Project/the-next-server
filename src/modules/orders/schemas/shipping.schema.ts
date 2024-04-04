import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingProvider } from '../enum';
import { LogSchema } from './log.schema';

export class ShippingSchema {
    @ApiProperty({ example: ShippingProvider.GHTK, enum: ShippingProvider, type: String })
    @Prop({ required: true, type: String, enum: ShippingProvider, default: ShippingProvider.GHTK })
    provider: string;

    @ApiProperty({ example: 15000, type: Number })
    @Prop({ required: true, type: Number, default: 0 })
    fee: number;

    @ApiPropertyOptional({ example: [], type: [LogSchema] })
    @Prop({ required: false, type: [LogSchema], default: [] })
    logs: LogSchema[];
}
