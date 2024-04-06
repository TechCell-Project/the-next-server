import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Brand } from '../schemas';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { BrandStatus } from '../enums';

export class CreateBrandDto extends OmitType(Brand, ['_id']) {
    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsEnum(BrandStatus)
    status: string;
}
