import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeSchema } from './attribute.schema';
import { HydratedDocument, ObjectId } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'productModels',
})
export class ProductModel extends AbstractDocument {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Factory(() => '5f9a7f5d9d8f6d7f5d8f6d7')
    @Prop({ type: String, required: true })
    brandId: ObjectId;

    @ApiProperty({ example: 'iphone-15', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Iphone 15', type: String })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iPhone 15 Models', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ type: [AttributeSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeSchema], default: [] })
    attributes: AttributeSchema[];
}

export type ProductModelDocument = HydratedDocument<ProductModel>;
export const ProductModelSchema = SchemaFactory.createForClass(ProductModel);
