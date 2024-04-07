import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeStatusEnum } from '../attribute.enum';
import { NullableType } from '~/common/types';

@Schema({
    timestamps: true,
    collection: 'attributes',
})
export class Attribute extends AbstractDocument {
    constructor(data?: NullableType<Attribute>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({ example: 'ram', type: String, description: 'Attribute label, unique' })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    label: string;

    @ApiProperty({ example: 'RAM', type: String, description: 'Attribute name, can be translated' })
    @Prop({ required: true, type: String })
    name: string;

    @ApiPropertyOptional({ example: 'GB', type: String, description: 'Attribute unit' })
    @Prop({ required: false, type: String })
    unit: string;

    @ApiProperty({ example: 'Product RAM information', type: String })
    @Prop({ required: false, default: '', type: String })
    description: string;

    @ApiProperty({
        example: AttributeStatusEnum.Available,
        enum: AttributeStatusEnum,
        type: String,
        description: 'Attribute status',
    })
    @Factory((faker: Faker) => faker.helpers.enumValue(AttributeStatusEnum))
    @Prop({
        required: false,
        type: String,
        enum: AttributeStatusEnum,
        default: AttributeStatusEnum.Available,
    })
    status: string;
}

export type AttributeDocument = HydratedDocument<Attribute>;
export const AttributeSchema = SchemaFactory.createForClass(Attribute);
