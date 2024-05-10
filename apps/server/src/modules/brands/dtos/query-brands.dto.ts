import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { Brand } from '../schemas';
import { ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BrandStatusEnum } from '../enums';
import { Type } from 'class-transformer';

export class FilterBrandsDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        type: [BrandStatusEnum],
        enum: BrandStatusEnum,
        example: [BrandStatusEnum.Active, BrandStatusEnum.Inactive],
    })
    @IsOptional()
    @IsEnum(BrandStatusEnum, { each: true })
    status?: BrandStatusEnum[] | null;
}

export class SortBrandsDto extends IntersectionType(SortDto<Brand>) {}

export class QueryBrandsDto extends QueryManyWithPaginationDto<FilterBrandsDto, SortBrandsDto> {
    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${FilterBrandsDto.name}`,
        format: getSchemaPath(FilterBrandsDto),
    })
    @IsOptional()
    @JsonTransform(FilterBrandsDto)
    @ValidateNested()
    @Type(() => FilterBrandsDto)
    filters?: FilterBrandsDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortBrandsDto.name}[]`,
        format: getSchemaPath(SortBrandsDto),
    })
    @IsOptional()
    @JsonTransform(SortBrandsDto)
    @ValidateNested({ each: true })
    @Type(() => SortBrandsDto)
    sort?: SortBrandsDto[] | null;
}
