import { AbstractDocument } from '~/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { Faker } from '@faker-js/faker';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { AttributeInProductSchema, ImageSchema } from '~/server/spus/schemas';
import { PriceSchema } from './price.schema';
import { SkuStatusEnum } from '../skus.enum';

@Schema({
    timestamps: true,
    collection: 'skus',
})
export class SKU extends AbstractDocument {
    constructor(data?: Partial<SKU>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({ example: 'iPhone 15 Plus 256GB', type: String })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iPhone 15 Plus ...', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ type: String, format: 'ObjectId', example: '5f9a7f5d9d8f6d7f5d8f6d7' })
    @Prop({ required: true, type: Types.ObjectId, ref: 'spus' })
    spuId: Types.ObjectId;

    @ApiProperty({ type: String, example: 'plus' })
    @Prop({ required: true, type: String })
    spuModelSlug: string;

    @ApiProperty({ type: PriceSchema })
    @Factory(() => {})
    @Prop({ required: true, type: PriceSchema, default: {} })
    price: PriceSchema;

    @ApiProperty({ type: ImageSchema })
    @Factory(() => {})
    @Prop({ required: true, type: ImageSchema, default: {} })
    image: ImageSchema;

    @ApiProperty({ example: SkuStatusEnum.Selling, enum: SkuStatusEnum, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(SkuStatusEnum))
    @Prop({
        required: true,
        type: String,
        enum: SkuStatusEnum,
        default: SkuStatusEnum.Selling,
    })
    status: string;

    @ApiProperty({ type: [AttributeInProductSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeInProductSchema], default: [] })
    attributes: AttributeInProductSchema[];

    @ApiProperty({ example: ['ip15prm1234', 'ip15prm1235', 'ip15prm1236'], type: [String] })
    @Factory(() => [uuid()])
    @Prop({ required: true, type: [String], default: [uuid()] })
    serialNumbers: string[];

    @ApiProperty({
        example: ['5f9a7f5d9d8f6d7f5d8f6d7'],
        type: String,
        format: 'ObjectId',
        isArray: true,
    })
    @Factory(() => [])
    @Prop({ required: true, type: [Types.ObjectId], default: [], ref: 'categories' })
    categories: Types.ObjectId[];
}

export type SKUDocument = HydratedDocument<SKU>;
export const SKUSchema = SchemaFactory.createForClass(SKU);
