import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { PriceSchema } from '~/modules/product-variations';

export class ProductSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7' })
    @Prop({ required: true, type: String })
    variationId: ObjectId;

    @ApiProperty({ example: 2 })
    @Prop({ required: true, type: Number })
    quantity: number;

    @ApiProperty({ example: ['ip15prm12345', 'ip15prm67890'] })
    @Prop({ required: true, type: [String] })
    serialNumber: string[];

    @ApiProperty({ type: PriceSchema })
    @Prop({ required: true, type: PriceSchema })
    price: PriceSchema;
}
