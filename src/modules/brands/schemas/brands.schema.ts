import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common/abstract';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Brand extends AbstractDocument {
    @Factory(() => uuid())
    @Prop({ unique: true, required: true })
    label: string;

    @Factory((faker: Faker) => faker.company.name())
    @Prop({ required: true })
    name: string;
}

export type BrandDocument = HydratedDocument<Brand>;
export const BrandSchema = SchemaFactory.createForClass(Brand);
