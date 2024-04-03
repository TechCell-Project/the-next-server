import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeStatus } from '../attribute.enum';
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

    @ApiProperty({ example: 'ram', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    label: string;

    @ApiProperty({ example: 'RAM', type: String })
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'GB', type: String })
    @Prop({ required: false, type: String })
    unit: string;

    @ApiProperty({ example: 'Product RAM information', type: String })
    @Prop({ required: false, default: '', type: String })
    description: string;

    @ApiProperty({ example: AttributeStatus.Available, enum: AttributeStatus, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(AttributeStatus))
    @Prop({
        required: false,
        type: String,
        enum: AttributeStatus,
        default: AttributeStatus.Available,
    })
    status: string;
}

export type AttributeDocument = HydratedDocument<Attribute>;
export const AttributeSchema = SchemaFactory.createForClass(Attribute);
