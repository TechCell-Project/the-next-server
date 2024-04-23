import { IntersectionType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttributeInProductSchema } from '../schemas';

export class AttributeInProductDto extends IntersectionType(AttributeInProductSchema) {
    @IsString()
    @IsNotEmpty()
    k: string;

    @IsString()
    @IsNotEmpty()
    v: string;

    @IsOptional()
    @IsString()
    u: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}
