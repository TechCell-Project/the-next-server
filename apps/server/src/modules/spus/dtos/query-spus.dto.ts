import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { SPU } from '../schemas';
import {
    ApiHideProperty,
    ApiPropertyOptional,
    IntersectionType,
    getSchemaPath,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Exclude, Type } from 'class-transformer';
import { SpuStatusEnum } from '../spus.enum';
import { Types } from 'mongoose';

export class FilterSpuDto {
    @ApiPropertyOptional({
        type: String,
        example: 'keyword to search',
        description: 'Search by keyword',
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        enum: SpuStatusEnum,
        isArray: true,
        example: [SpuStatusEnum.Available, SpuStatusEnum.Deleted],
        description: 'List of status of SPU',
    })
    @IsOptional()
    @IsEnum(SpuStatusEnum, { each: true })
    status?: SpuStatusEnum[];

    @ApiHideProperty()
    @Exclude()
    brandIds?: string[] | Types.ObjectId[];

    @ApiHideProperty()
    @Exclude()
    spuIds?: string[] | Types.ObjectId[];
}

export class SortSpuDto extends IntersectionType(SortDto<SPU>) {}

export class QuerySpusDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterSpuDto, SortSpuDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterSpuDto),
        type: String,
        description: `JSON string of ${FilterSpuDto.name}`,
    })
    @IsOptional()
    @JsonTransform(FilterSpuDto)
    @ValidateNested()
    @Type(() => FilterSpuDto)
    filters?: FilterSpuDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortSpuDto.name}[]`,
        format: getSchemaPath(SortSpuDto),
    })
    @IsOptional()
    @JsonTransform(SortSpuDto)
    @ValidateNested({ each: true })
    @Type(() => SortSpuDto)
    sort?: SortSpuDto[] | null;
}
