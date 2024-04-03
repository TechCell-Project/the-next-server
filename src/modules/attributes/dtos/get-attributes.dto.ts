import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
    PartialType,
    OmitType,
    getSchemaPath,
} from '@nestjs/swagger';
import { QueryManyWithPaginationDto } from '~/common';
import { Attribute } from '../schemas';
import { IsJSON, IsString, ValidateNested } from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { SortCase } from '~/common/enums';

export class FilterAttributeDto extends OmitType(PartialType(Attribute), ['status', '_id']) {}

export class SortAttributeDto {
    @ApiProperty({
        type: String,
        example: 'label',
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof Attribute;

    @ApiProperty({
        type: String,
        enum: SortCase,
        example: SortCase.Asc,
    })
    @IsString()
    order: string;
}

export class GetAttributesDto extends IntersectionType(
    QueryManyWithPaginationDto<FilterAttributeDto, SortAttributeDto>,
) {
    @ApiPropertyOptional({
        format: getSchemaPath(FilterAttributeDto),
        type: String,
        description: `JSON string of ${FilterAttributeDto.name}`,
    })
    @IsString()
    @IsJSON()
    @Transform(({ value }) =>
        value ? plainToInstance(FilterAttributeDto, JSON.parse(value)) : undefined,
    )
    @ValidateNested()
    @Type(() => FilterAttributeDto)
    filters?: FilterAttributeDto | null | undefined;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortAttributeDto.name}`,
        format: getSchemaPath(SortAttributeDto),
    })
    @IsString()
    @IsJSON()
    @Transform(({ value }) =>
        value ? plainToInstance(SortAttributeDto, JSON.parse(value)) : undefined,
    )
    @ValidateNested({ each: true })
    @Type(() => SortAttributeDto)
    sort?: SortAttributeDto[] | null | undefined;
}
