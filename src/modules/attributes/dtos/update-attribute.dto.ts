import { PickType, PartialType } from '@nestjs/swagger';
import { Attribute } from '../schemas';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttributeStatus } from '../attribute.enum';

export class UpdateAttributeDto extends PartialType(
    PickType(Attribute, ['status', 'name', 'description']),
) {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    name?: string | undefined;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    description?: string | undefined;

    @IsOptional()
    @IsEnum(AttributeStatus)
    status?: AttributeStatus | undefined;
}
