import { PickType, PartialType } from '@nestjs/swagger';
import { Attribute } from '../schemas';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttributeStatusEnum } from '../attribute.enum';

export class UpdateAttributeDto extends PartialType(
    PickType(Attribute, ['status', 'name', 'description', 'unit']),
) {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(AttributeStatusEnum)
    status?: AttributeStatusEnum;

    @IsOptional()
    @IsString()
    unit?: string;
}
