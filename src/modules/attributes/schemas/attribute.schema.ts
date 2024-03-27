import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Factory } from 'nestjs-seeder';
import { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '~/common/abstract';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { AttributeStatus } from '../attribute.enum';

@Schema({
    timestamps: true,
    collection: 'attributes',
})
export class Attribute extends AbstractDocument {
    @ApiProperty({ example: 'ram' })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    label: string;

    @ApiProperty({ example: 'RAM' })
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'Product RAM infor' })
    @Prop({ required: false, default: '', type: String })
    description: string;

    @ApiProperty({ example: 'GB' })
    @Prop({ required: false, type: String })
    unit: string;

    @ApiProperty({ example: AttributeStatus.Available, enum: AttributeStatus })
    @Factory((faker: Faker) => faker.helpers.enumValue(AttributeStatus))
    @Prop({ required: true, type: String, enum: AttributeStatus })
    status: string;
}

export type AttributeDocument = HydratedDocument<Attribute>;
export const AttributeSchema = SchemaFactory.createForClass(Attribute);
