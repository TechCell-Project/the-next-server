import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument, Types } from 'mongoose';
import { AttributeInProductSchema } from './spu-attribute.schema';
import { SPUModelSchema } from './spu-model.schema';
import { SpuStatusEnum } from '../spus.enum';

@Schema({
    timestamps: true,
    collection: 'spus',
})
export class SPU extends AbstractDocument {
    constructor(data?: Partial<SPU>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Factory(() => new Types.ObjectId())
    @Prop({ type: Types.ObjectId, required: true, ref: 'brands' })
    brandId: Types.ObjectId;

    @ApiProperty({ example: 'iphone-15', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'iPhone 15 Series', type: String })
    @Factory((faker: Faker) => faker.commerce.productName())
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'This is iPhone 15 series', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ type: [AttributeInProductSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [AttributeInProductSchema], default: [] })
    commonAttributes: AttributeInProductSchema[];

    @ApiProperty({ type: [SPUModelSchema] })
    @Prop({ required: true, type: [SPUModelSchema], default: [] })
    models: SPUModelSchema[];

    @ApiProperty({ enum: SpuStatusEnum, example: SpuStatusEnum.Available })
    @Prop({ required: false, type: String, enum: SpuStatusEnum, default: SpuStatusEnum.Available })
    status: SpuStatusEnum;
}

export type SPUDocument = HydratedDocument<SPU>;
export const SPUSchema = SchemaFactory.createForClass(SPU);
