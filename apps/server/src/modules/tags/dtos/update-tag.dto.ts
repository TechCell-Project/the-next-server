import { PartialType, PickType } from '@nestjs/swagger';
import { Tag } from '../schemas';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TagStatusEnum } from '../status.enum';

export class UpdateTagDto extends PartialType(PickType(Tag, ['status', 'name', 'description'])) {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TagStatusEnum)
    status?: TagStatusEnum;
}
