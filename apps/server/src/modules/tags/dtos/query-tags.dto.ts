import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
    PartialType,
    getSchemaPath,
    PickType,
} from '@nestjs/swagger';
import { JsonTransform, QueryManyWithPaginationDto } from '~/common';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SortCaseEnum } from '~/common/enums';
import { Tag } from '../schemas';
import { TagStatusEnum } from '../status.enum';

export class FilterTagDto extends PartialType(PickType(Tag, ['slug'])) {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string | undefined;

    @IsOptional()
    @IsString()
    slug?: string | undefined;

    @ApiProperty({
        example: TagStatusEnum.Active,
        enum: TagStatusEnum,
        type: String,
        isArray: true,
    })
    @IsOptional()
    @IsEnum(TagStatusEnum, { each: true })
    status?: TagStatusEnum[];
}

export class SortTagDto {
    @ApiProperty({
        type: String,
        example: 'key of tag',
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof Tag;

    @ApiProperty({
        type: String,
        enum: SortCaseEnum,
        example: SortCaseEnum.Asc,
    })
    @IsEnum(SortCaseEnum)
    order: string;
}

export class QueryTagsDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterTagDto, SortTagDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterTagDto),
        type: String,
        description: `JSON string of ${FilterTagDto.name}`,
    })
    @IsOptional()
    @JsonTransform(FilterTagDto)
    @ValidateNested()
    @Type(() => FilterTagDto)
    filters?: FilterTagDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortTagDto.name}`,
        format: getSchemaPath(SortTagDto),
    })
    @IsOptional()
    @JsonTransform(SortTagDto)
    @ValidateNested({ each: true })
    @Type(() => SortTagDto)
    sort?: SortTagDto[] | null | undefined;
}
