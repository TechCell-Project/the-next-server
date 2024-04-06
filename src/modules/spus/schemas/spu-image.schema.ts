import { Faker } from '@faker-js/faker';
import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Factory } from 'nestjs-seeder';

export class ImageSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Factory(() => new Types.ObjectId())
    @Prop({ required: true, type: String })
    publicId: string;

    @ApiProperty({
        example:
            'https://res.cloudinary.com/techcell/image/upload/v1653506588/techcell/5f9a7f5d9d8f6d7f5d8f6d7/iphone-15.png',
        type: String,
    })
    @Factory((faker: Faker) => faker.image.url())
    @Prop({ required: true, type: String })
    url: string;

    @ApiProperty({ example: false, type: Boolean })
    @Factory(() => false)
    @Prop({ required: true, type: Boolean, default: false })
    isThumbnail: boolean;
}
