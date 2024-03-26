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
    @ApiProperty({ example: 'apple' })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true })
    slug: string;

    @ApiProperty({ example: 'Apple' })
    @Factory((faker: Faker) => faker.company.name())
    @Prop({ required: true })
    name: string;

    @ApiProperty({ example: 'Apple Inc.' })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, default: '' })
    description: string;

    @ApiProperty({ example: BrandStatus.Active, enum: BrandStatus })
    @Factory((faker: Faker) => faker.helpers.enumValue(BrandStatus))
    @Prop({ required: true, default: BrandStatus.Active })
    status: string;
}

export type BrandDocument = HydratedDocument<Brand>;
export const BrandSchema = SchemaFactory.createForClass(Brand);
