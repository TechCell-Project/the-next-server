import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Order, SelectOrderTypeEnum } from '~/server/orders';

export class FilterOrdersMntDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        type: String,
        enum: SelectOrderTypeEnum,
        example: SelectOrderTypeEnum.both,
    })
    @IsOptional()
    @IsEnum(SelectOrderTypeEnum)
    selectType?: SelectOrderTypeEnum;
}

export class SortOrdersMntDto extends IntersectionType(SortDto<Order>) {}

export class QueryOrdersMntDto extends QueryManyWithPaginationDto<
    FilterOrdersMntDto,
    SortOrdersMntDto
> {
    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${FilterOrdersMntDto.name}`,
        format: getSchemaPath(FilterOrdersMntDto),
    })
    @IsOptional()
    @JsonTransform(FilterOrdersMntDto)
    @ValidateNested()
    @Type(() => FilterOrdersMntDto)
    filters?: FilterOrdersMntDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortOrdersMntDto.name}[]`,
        format: getSchemaPath(SortOrdersMntDto),
    })
    @IsOptional()
    @JsonTransform(SortOrdersMntDto)
    @ValidateNested({ each: true })
    @Type(() => SortOrdersMntDto)
    sort?: SortOrdersMntDto[] | null;
}
