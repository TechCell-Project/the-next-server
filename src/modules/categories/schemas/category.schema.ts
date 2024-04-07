import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common/abstract';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatusEnum } from '../status.enum';

@Schema({
    timestamps: true,
    collection: 'categories',
})
export class Category extends AbstractDocument {
    @ApiProperty({ example: 'selling', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Đang bán', type: String })
    @Factory((faker: Faker) => faker.company.name())
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'Product that is selling.', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ example: CategoryStatusEnum.Active, enum: CategoryStatusEnum, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(CategoryStatusEnum))
    @Prop({ required: true, default: CategoryStatusEnum.Active, type: String })
    status: string;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
