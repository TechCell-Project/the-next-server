import { JsonTransform, QueryManyWithPaginationDto, SortDto } from '~/common';
import {
    ApiHideProperty,
    ApiPropertyOptional,
    IntersectionType,
    getSchemaPath,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SerialNumber } from '~/server/skus';
import { SerialNumberStatusEnum } from '../enums';
import { Types } from 'mongoose';

export class FilterSerialNumberDto {
    @ApiHideProperty()
    skuId: string | Types.ObjectId;

    @ApiPropertyOptional({
        enum: SerialNumberStatusEnum,
        isArray: true,
        example: [SerialNumberStatusEnum.Available],
    })
    @IsOptional()
    @IsEnum(SerialNumberStatusEnum, { each: true })
    status?: SerialNumberStatusEnum[];
}

export class SortSerialNumberDto extends IntersectionType(SortDto<SerialNumber>) {}

export class QuerySerialNumberDto extends QueryManyWithPaginationDto<
    FilterSerialNumberDto,
    SortSerialNumberDto
> {
    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${FilterSerialNumberDto.name}`,
        format: getSchemaPath(FilterSerialNumberDto),
    })
    @IsOptional()
    @JsonTransform(FilterSerialNumberDto)
    @ValidateNested()
    @Type(() => FilterSerialNumberDto)
    filters?: FilterSerialNumberDto | null;

    @ApiPropertyOptional({
        type: String,
        description: `JSON string of ${SortSerialNumberDto.name}[]`,
        format: getSchemaPath(SortSerialNumberDto),
    })
    @IsOptional()
    @JsonTransform(SortSerialNumberDto)
    @ValidateNested({ each: true })
    @Type(() => SortSerialNumberDto)
    sort?: SortSerialNumberDto[] | null;
}
