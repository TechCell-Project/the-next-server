import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Brand } from '../schemas';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { BrandStatusEnum } from '../enums';

export class CreateBrandDto extends OmitType(Brand, ['_id', 'slug']) {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsEnum(BrandStatusEnum)
    status: string;
}
