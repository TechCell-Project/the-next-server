import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class PriceSchema {
    @ApiProperty({ example: 20000000 })
    @Prop({ required: true, type: Number })
    base: number;

    @ApiProperty({ example: 0 })
    @Prop({ required: true, type: Number, default: 0 })
    special: number;
}
