import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common/abstract';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BrandStatus } from '../enums';

@Schema({
    timestamps: true,
    collection: 'brands',
})
export class Brand extends AbstractDocument {
    constructor(data?: Partial<Brand>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({ example: 'apple', type: String, uniqueItems: true })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Apple', type: String })
    @Factory((faker: Faker) => faker.company.name())
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'Apple Inc.', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, default: '', type: String })
    description: string;

    @ApiProperty({ example: BrandStatus.Active, enum: BrandStatus, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(BrandStatus))
    @Prop({ required: true, default: BrandStatus.Active, type: String })
    status: string;
}

export type BrandDocument = HydratedDocument<Brand>;
export const BrandSchema = SchemaFactory.createForClass(Brand);
