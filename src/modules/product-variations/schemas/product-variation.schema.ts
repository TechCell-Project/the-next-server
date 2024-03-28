import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument, ObjectId } from 'mongoose';
import { VariationStatus } from '../status.enum';
import { AttributeSchema } from '~/modules/product-models/schemas/attribute.schema';
import { ImageSchema } from './image.schema';
import { PriceSchema } from './price.schema';

@Schema({
    timestamps: true,
    collection: 'productVariations',
})
export class ProductVariation extends AbstractDocument {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7' })
    @Factory(() => '5f9a7f5d9d8f6d7f5d8f6d7')
    @Prop({ type: String, required: true })
    seriesId: ObjectId;

    @ApiProperty({ example: 'red-128gb' })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Đỏ 128GB' })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iphone with color red & storage 128gb variation' })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ example: VariationStatus.Selling, enum: VariationStatus })
    @Factory((faker: Faker) => faker.helpers.enumValue(VariationStatus))
    @Prop({ required: true, type: String, enum: VariationStatus, default: VariationStatus.Selling })
    status: string;

    @ApiProperty({ type: [AttributeSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeSchema], default: [] })
    attributes: AttributeSchema[];

    @ApiProperty({ type: ImageSchema })
    @Factory(() => {})
    @Prop({ required: true, type: ImageSchema, default: {} })
    image: ImageSchema;

    @ApiProperty({ type: PriceSchema })
    @Factory(() => {})
    @Prop({ required: true, type: PriceSchema, default: {} })
    price: PriceSchema;

    @ApiProperty({ example: ['ip15prm1234', 'ip15prm1235', 'ip15prm1236'] })
    @Factory(() => uuid())
    @Prop({ required: true, type: [String], default: [uuid()] })
    serialNumbers: string[];

    @ApiProperty({ example: ['5f9a7f5d9d8f6d7f5d8f6d7'] })
    @Factory(() => ['5f9a7f5d9d8f6d7f5d8f6d7'])
    //It should be type [ObjectId] here I think, but I got error when do that
    @Prop({ required: true, type: [String], default: ['5f9a7f5d9d8f6d7f5d8f6d7'] })
    categories: ObjectId[];
}

export type ProductVariationDocument = HydratedDocument<ProductVariation>;
export const ProductVariationSchema = SchemaFactory.createForClass(ProductVariation);
