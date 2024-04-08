import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { ImageSchema } from './spu-image.schema';
import { AttributeInProductSchema } from './spu-attribute.schema';

export class SPUModelSchema {
    @ApiProperty({ example: 'promax', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'iPhone 15 Plus', type: String })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iPhone 15 Plus model', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ type: [AttributeInProductSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeInProductSchema], default: [] })
    attributes: AttributeInProductSchema[];

    @ApiProperty({ type: [ImageSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [ImageSchema], default: [] })
    images: ImageSchema[];
}
