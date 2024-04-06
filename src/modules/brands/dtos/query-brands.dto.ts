import { QueryManyWithPaginationDto, SortDto } from '~/common';
import { Brand } from '../schemas';
import { ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { BrandStatus } from '../enums';
import { Transform, Type, plainToInstance } from 'class-transformer';

export class FilterBrandsDto {
    @ApiPropertyOptional({
        type: [BrandStatus],
        enum: BrandStatus,
        example: [BrandStatus.Active, BrandStatus.Inactive],
    })
    @IsOptional()
    @IsEnum(BrandStatus)
    status: BrandStatus[] | null;
}

export class SortBrandsDto extends IntersectionType(SortDto<Brand>) {}

export class QueryBrandsDto extends QueryManyWithPaginationDto<FilterBrandsDto, SortBrandsDto> {
    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${FilterBrandsDto.name}`,
        format: getSchemaPath(FilterBrandsDto),
    })
    @IsOptional()
    @Transform(({ value }) =>
        value ? plainToInstance(FilterBrandsDto, JSON.parse(value)) : undefined,
    )
    @ValidateNested()
    @Type(() => FilterBrandsDto)
    filters?: FilterBrandsDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortBrandsDto.name}`,
        format: getSchemaPath(SortBrandsDto),
    })
    @IsOptional()
    @Transform(({ value }) => {
        return value ? plainToInstance(SortBrandsDto, JSON.parse(value)) : undefined;
    })
    @ValidateNested({ each: true })
    @Type(() => SortBrandsDto)
    sort?: SortBrandsDto[] | null;
}
