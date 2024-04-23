import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TagStatusEnum } from '../status.enum';

export class CreateTagDto {
    @ApiProperty({
        example: 'Điện thoại tầm trung',
        description: 'Tên nhãn',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'A great product...',
        description: 'Mô tả',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({
        example: TagStatusEnum.Active,
        enum: TagStatusEnum,
        type: String,
    })
    @IsOptional()
    @IsEnum(TagStatusEnum)
    status: string;
}
