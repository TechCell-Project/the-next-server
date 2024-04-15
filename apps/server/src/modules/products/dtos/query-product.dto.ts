import { ApiProperty, ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { JsonTransform, QueryManyWithPaginationDto } from '~/common';
import { IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SortCaseEnum } from '~/common/enums';
import { ProductDto } from './product.dto';

export class FilterProductsDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        type: String,
        isArray: true,
        example: 'id of brand',
    })
    @IsOptional()
    @IsMongoId({ each: true })
    brandId?: string[];

    @ApiPropertyOptional({
        type: String,
        isArray: true,
        example: 'id of tag',
    })
    @IsOptional()
    @IsMongoId({ each: true })
    tagId?: string[];
}

export class SortProductsDto {
    @ApiProperty({
        type: String,
        example: `key of ${ProductDto.name} to sort by`,
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof ProductDto;

    @ApiProperty({
        type: String,
        enum: SortCaseEnum,
        example: SortCaseEnum.Asc,
    })
    @IsEnum(SortCaseEnum)
    order: string;
}

export class QueryProductsDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterProductsDto, SortProductsDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterProductsDto),
        type: String,
        description: `JSON string of ${FilterProductsDto.name}`,
    })
    @IsOptional()
    @JsonTransform(FilterProductsDto)
    @ValidateNested()
    @Type(() => FilterProductsDto)
    filters?: FilterProductsDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortProductsDto.name}`,
        format: getSchemaPath(SortProductsDto),
    })
    @IsOptional()
    @JsonTransform(SortProductsDto)
    @ValidateNested({ each: true })
    @Type(() => SortProductsDto)
    sort?: SortProductsDto[] | null;
}
