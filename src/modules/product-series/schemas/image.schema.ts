import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class ImageSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7' })
    @Prop({ required: true, type: String })
    publicId: string;

    @ApiProperty({
        example:
            'https://res.cloudinary.com/techcell/image/upload/v1653506588/techcell/5f9a7f5d9d8f6d7f5d8f6d7/iphone-15.png',
    })
    @Prop({ required: true, type: String })
    url: string;

    @ApiProperty({ example: false })
    @Prop({ required: true, type: Boolean, default: false })
    isThumbnail: boolean;
}