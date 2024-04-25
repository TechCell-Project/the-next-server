import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AbstractDocument } from '~/common/abstract';
import { SKU } from '~/server/skus/schemas';
import { User } from '~/server/users';

export class ProductCartSchema {
    @ApiProperty({
        type: String,
        description: 'Product ID',
        example: 'iphone-11-pro|6626121ee7c00c46f9747999',
        format: 'slug|ObjectId',
    })
    @Prop({ type: String, required: true })
    productId: string;

    @ApiProperty({
        type: String,
        description: 'Sku ID',
        example: '6626122ae7c00c46f9747ecd',
        format: 'ObjectId',
    })
    @Prop({ type: Types.ObjectId, ref: SKU.name })
    skuId: Types.ObjectId;

    @ApiProperty({
        type: Number,
        description: 'Product quantity',
        example: 1,
    })
    @Prop({ type: Number, required: true })
    quantity: number;

    @ApiPropertyOptional({
        type: Date,
        description: 'Product created at',
        example: new Date(Date.now()),
    })
    @Prop({ type: Date, default: Date.now })
    createdAt?: Date;

    @ApiPropertyOptional({
        type: Date,
        description: 'Product updated at',
        example: new Date(Date.now()),
    })
    @Prop({ type: Date, default: Date.now })
    updatedAt?: Date;
}

@Schema({ timestamps: true })
export class Cart extends AbstractDocument {
    @ApiProperty({
        type: String,
        description: 'User ID',
        example: '5f9d5f3b9d6b2b0017b6d5a0',
        format: 'ObjectId',
    })
    @Prop({ unique: true, required: true, type: Types.ObjectId, ref: User.name })
    userId: Types.ObjectId;

    @ApiProperty({
        isArray: true,
        type: ProductCartSchema,
        description: 'List of products in cart',
        required: false,
    })
    @Prop({ required: true, type: Array<ProductCartSchema> })
    products: Array<ProductCartSchema>;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
