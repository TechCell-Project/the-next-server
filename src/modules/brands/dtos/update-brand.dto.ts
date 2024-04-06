import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Brand } from '../schemas';
import { OmitType, PartialType } from '@nestjs/swagger';
import { BrandStatus } from '../enums';

export class UpdateBrandDto extends PartialType(OmitType(Brand, ['_id', 'slug'])) {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string;

    @IsOptional()
    @IsString()
    @IsEnum(BrandStatus)
    status?: string;
}
