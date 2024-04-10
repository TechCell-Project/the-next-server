import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import { SPU } from '../schemas';
import { ApiPropertyOptional, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SpuStatusEnum } from '../spus.enum';

export class FilterSpuDto {
    @ApiPropertyOptional({
        enum: SpuStatusEnum,
        isArray: true,
        example: [SpuStatusEnum.Available, SpuStatusEnum.Deleted],
        description: 'List of status of SPU',
    })
    @IsOptional()
    @IsEnum(SpuStatusEnum, { each: true })
    status?: SpuStatusEnum[];
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
    @IsString()
    @JsonTransform(FilterSpuDto)
    @ValidateNested()
    @Type(() => FilterSpuDto)
    filters?: FilterSpuDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortSpuDto.name}`,
        format: getSchemaPath(SortSpuDto),
    })
    @IsOptional()
    @IsString()
    @JsonTransform(SortSpuDto)
    @ValidateNested({ each: true })
    @Type(() => SortSpuDto)
    sort?: SortSpuDto[] | null | undefined;
}
