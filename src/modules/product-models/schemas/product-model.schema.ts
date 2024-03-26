import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeSchema } from './attribute.schema';
import { HydratedDocument } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'productModels',
})
export class ProductModel extends AbstractDocument {
    @ApiProperty({ example: 'iphone-15' })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Iphone 15' })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'This is iPhone 15 Series' })
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