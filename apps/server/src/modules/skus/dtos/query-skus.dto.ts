import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { SKU } from '../schemas';
import {
    ApiHideProperty,
    ApiPropertyOptional,
    IntersectionType,
    getSchemaPath,
} from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { SkuStatusEnum } from '../enums';
import { Types } from 'mongoose';

export class FilterSkuDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        enum: SkuStatusEnum,
        isArray: true,
        example: [SkuStatusEnum.Selling, SkuStatusEnum.Newly],
        description: 'List of status of SKU',
    })
    status?: SkuStatusEnum[];

    @ApiHideProperty()
    @Exclude()
    tagIds?: string[] | Types.ObjectId[];
}

export class SortSkuDto extends IntersectionType(SortDto<SKU>) {}

export class QuerySkusDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterSkuDto, SortSkuDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterSkuDto),
        type: String,
        description: `JSON string of ${FilterSkuDto.name}`,
    })
    @IsOptional()
    @JsonTransform(FilterSkuDto)
    @ValidateNested()
    @Type(() => FilterSkuDto)
    filters?: FilterSkuDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortSkuDto.name}`,
        format: getSchemaPath(SortSkuDto),
    })
    @IsOptional()
    @JsonTransform(SortSkuDto)
    @ValidateNested({ each: true })
    @Type(() => SortSkuDto)
    sort?: SortSkuDto[] | null;
}
