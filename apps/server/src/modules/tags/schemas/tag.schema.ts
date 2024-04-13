import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common/abstract';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';
import { Faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TagStatusEnum } from '../status.enum';

@Schema({
    timestamps: true,
    collection: 'tags',
})
export class Tag extends AbstractDocument {
    constructor(data: Partial<Tag>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({ example: 'apple', type: String })
    @Factory(() => uuid())
    @Prop({ unique: true, required: true, type: String })
    slug: string;

    @ApiProperty({ example: 'Apple', type: String })
    @Factory((faker: Faker) => faker.company.name())
    @Prop({ required: true, type: String })
    name: string;

    @ApiProperty({ example: 'A great product...', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    description: string;

    @ApiProperty({ example: TagStatusEnum.Active, enum: TagStatusEnum, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(TagStatusEnum))
    @Prop({ required: true, default: TagStatusEnum.Active, type: String })
    status: string;
}

export type TagDocument = HydratedDocument<Tag>;
export const TagSchema = SchemaFactory.createForClass(Tag);
