import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CloudinaryResponse } from '~/third-party/cloudinary.com/cloudinary-response';

export class ImageUploadedResponseDTO {
    constructor({ public_id, secure_url }: CloudinaryResponse) {
        this.publicId = public_id;
        this.url = secure_url.replace(/\.png$/, '.webp');
    }

    @ApiProperty({
        description: 'Image public id',
    })
    @IsString()
    @IsNotEmpty()
    publicId: string;

    @ApiProperty({
        description: 'Image url',
    })
    @IsString()
    @IsNotEmpty()
    url: string;
}
