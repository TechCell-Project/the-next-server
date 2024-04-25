import { Faker } from '@faker-js/faker';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Factory } from 'nestjs-seeder';

/**
 * @description Abstract document
 *
 * `FeatureName` is a `Class.Name`
 *
 * `CollectionName` is a lowercase and plural of `FeatureName`
 */
@Schema({ timestamps: true })
export class AbstractDocument {
    @ApiProperty({ example: '5f9d5c1d5c1d5c1d5c1d5c1d', type: String, format: 'ObjectId' })
    @Factory((faker: Faker) => new Types.ObjectId(faker.database.mongodbObjectId()))
    @Prop({ type: Types.ObjectId, default: new Types.ObjectId(), required: false })
    _id: Types.ObjectId;
}
