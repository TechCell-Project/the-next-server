import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SlugParamDto {
    @ApiProperty({
        type: String,
        example: 'slug',
        format: 'slug',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;
}
