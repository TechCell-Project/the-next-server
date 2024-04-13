import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
    PartialType,
    OmitType,
    getSchemaPath,
} from '@nestjs/swagger';
import { JsonTransform, QueryManyWithPaginationDto } from '~/common';
import { Attribute } from '../schemas';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SortCaseEnum } from '~/common/enums';
import { AttributeStatusEnum } from '../attribute.enum';

export class FilterAttributeDto extends OmitType(PartialType(Attribute), ['_id', 'status']) {
    @IsOptional()
    @IsString()
    description?: string | undefined;

    @IsOptional()
    @IsString()
    label?: string | undefined;

    @IsOptional()
    @IsString()
    name?: string | undefined;

    @ApiPropertyOptional({
        type: [AttributeStatusEnum],
        enum: AttributeStatusEnum,
        example: [AttributeStatusEnum.Available, AttributeStatusEnum.Deleted],
    })
    @IsOptional()
    @IsEnum(AttributeStatusEnum, { each: true })
    status?: AttributeStatusEnum[] | undefined;

    @IsOptional()
    @IsString()
    unit?: string | undefined;
}

export class SortAttributeDto {
    @ApiProperty({
        type: String,
        example: 'key of attribute',
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof Attribute;

    @ApiProperty({
        type: String,
        enum: SortCaseEnum,
        example: SortCaseEnum.Asc,
    })
    @IsEnum(SortCaseEnum)
    order: string;
}

export class QueryAttributesDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterAttributeDto, SortAttributeDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterAttributeDto),
        type: String,
        description: `JSON string of ${FilterAttributeDto.name}`,
    })
    @IsOptional()
    @JsonTransform(FilterAttributeDto)
    @ValidateNested()
    @Type(() => FilterAttributeDto)
    filters?: FilterAttributeDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortAttributeDto.name}`,
        format: getSchemaPath(SortAttributeDto),
    })
    @IsOptional()
    @JsonTransform(SortAttributeDto)
    @ValidateNested({ each: true })
    @Type(() => SortAttributeDto)
    sort?: SortAttributeDto[] | null | undefined;
}