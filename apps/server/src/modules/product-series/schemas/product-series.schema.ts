import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, ObjectId } from 'mongoose';
import { Factory } from 'nestjs-seeder';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeSchema } from '~/server/product-models/schemas/attribute.schema';
import { ImageSchema } from './image.schema';

@Schema({
    timestamps: true,
    collection: 'productSeries',
})
export class ProductSeries extends AbstractDocument {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String, format: 'ObjectId' })
    @Factory(() => '5f9a7f5d9d8f6d7f5d8f6d7')
    @Prop({ type: String, required: true })
    modelId: ObjectId;

    @ApiProperty({ example: 'pro-max', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Pro Max', type: String })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iphone Pro Max series', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ type: [AttributeSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeSchema], default: [] })
    attributes: AttributeSchema[];

    @ApiProperty({ type: [ImageSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [ImageSchema], default: [] })
    images: ImageSchema[];
}

export type ProductSeriesDocument = HydratedDocument<ProductSeries>;
export const ProductSeriesSchema = SchemaFactory.createForClass(ProductSeries);
