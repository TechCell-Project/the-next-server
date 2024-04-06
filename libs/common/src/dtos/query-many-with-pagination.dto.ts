import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortCase } from '../enums';

export class SortDto<T> {
    @ApiProperty({
        type: String,
        description: 'Key of Entity to sort',
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof T;

    @ApiProperty({
        type: String,
        description: 'Order of sorting',
        example: SortCase.Asc,
        enum: SortCase,
    })
    @IsString()
    @IsEnum(SortCase)
    order: string;
}

export class QueryManyWithPaginationDto<F, S> {
    @ApiPropertyOptional({
        type: Number,
    })
    @IsOptional()
    @Transform(({ value }) => (value ? Number(value) : 1))
    @IsNumber()
    page: number;

    @ApiPropertyOptional({
        type: Number,
    })
    @IsOptional()
    @Transform(({ value }) => (value ? Number(value) : 10))
    @IsNumber()
    limit: number;

    @ApiPropertyOptional({ type: String, description: 'JSON string' })
    @IsOptional()
    @IsJSON()
    @Transform(({ value }) => (value ? JSON.parse(value) : undefined))
    filters?: F | null;

    @ApiPropertyOptional({ type: String, description: 'JSON string' })
    @IsOptional()
    @IsJSON()
    @Transform(({ value }) => (value ? JSON.parse(value) : undefined))
    sort?: S[] | null;
}
