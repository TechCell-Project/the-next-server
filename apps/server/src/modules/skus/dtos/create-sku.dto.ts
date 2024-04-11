import {
    ApiPropertyOptional,
    IntersectionType,
    OmitType,
    PartialType,
    PickType,
} from '@nestjs/swagger';
import { SKU } from '../schemas';
import { Types } from 'mongoose';
import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriceSchema } from '../schemas/price.schema';
import { AttributeInProductDto } from '~/server/spus/dtos';
import { SkuStatusEnum } from '../enums';

export class PriceDto extends IntersectionType(PriceSchema) {
    @IsNumber()
    @Min(0)
    @Max(Number.MAX_SAFE_INTEGER)
    base: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(Number.MAX_SAFE_INTEGER)
    special: number = 0;
}

export class CreateSkuDto extends IntersectionType(
    OmitType(SKU, ['_id', 'image']),
    PartialType(PickType(SKU, ['categories'])),
) {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsMongoId()
    @Type(() => Types.ObjectId)
    spuId: Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    spuModelSlug: string;

    @IsOptional()
    @IsMongoId({ each: true })
    @Type(() => Types.ObjectId)
    categories: Types.ObjectId[];

    @ApiPropertyOptional({ example: 'public-id-image', type: String })
    @IsOptional()
    @IsNotEmpty({ message: 'mustBeNotEmpty' })
    imagePublicId?: string;

    @ValidateNested()
    @Type(() => PriceDto)
    price: PriceDto;

    @ValidateNested({ each: true })
    @Type(() => AttributeInProductDto)
    attributes: AttributeInProductDto[];

    @IsOptional()
    @IsEnum(SkuStatusEnum)
    status: string = SkuStatusEnum.Newly;
}
