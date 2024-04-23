import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from '../enum';
import { Order } from '../schemas';

export class FilterOrdersDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        type: [OrderStatusEnum],
        enum: OrderStatusEnum,
        example: [OrderStatusEnum.Canceled, OrderStatusEnum.Completed],
    })
    @IsOptional()
    @IsEnum(OrderStatusEnum, { each: true })
    status?: OrderStatusEnum[] | null;
}

export class SortOrdersDto extends IntersectionType(SortDto<Order>) {}

export class QueryOrdersDto extends QueryManyWithPaginationDto<FilterOrdersDto, SortOrdersDto> {
    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${FilterOrdersDto.name}`,
        format: getSchemaPath(FilterOrdersDto),
    })
    @IsOptional()
    @JsonTransform(FilterOrdersDto)
    @ValidateNested()
    @Type(() => FilterOrdersDto)
    filters?: FilterOrdersDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortOrdersDto.name}`,
        format: getSchemaPath(SortOrdersDto),
    })
    @IsOptional()
    @JsonTransform(SortOrdersDto)
    @ValidateNested({ each: true })
    @Type(() => SortOrdersDto)
    sort?: SortOrdersDto[] | null;
}
