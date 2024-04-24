import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ImageSchema } from '~/server/skus/schemas';
import { PriceSchema } from '~/server/skus/schemas/price.schema';

export class ProductSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Prop({ required: true, type: String })
    skuId: Types.ObjectId;

    @ApiProperty({ example: 'Iphone 15', type: String })
    @Prop({ required: true, type: String })
    productName: string;

    @ApiPropertyOptional({ example: '512GB - Gold', type: String })
    @Prop({ required: false, type: String })
    productType?: string;

    @ApiProperty({ type: ImageSchema })
    @Prop({ required: false, type: ImageSchema, default: {} })
    image?: ImageSchema;

    @ApiPropertyOptional({ example: ['ip15prm12345', 'ip15prm67890'], type: [String] })
    @Prop({ required: false, type: [String], default: [] })
    serialNumber: string[];

    @ApiProperty({ type: PriceSchema })
    @Prop({ required: true, type: PriceSchema })
    unitPrice: PriceSchema;

    @Prop({ required: true, type: Number, default: 1 })
    @ApiProperty({ example: 1, type: Number })
    quantity: number;
}
