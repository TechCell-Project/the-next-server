import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsJSON, IsNumber, IsOptional } from 'class-validator';

export class QueryManyWithPaginationDto<F, S> {
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => (value ? Number(value) : 1))
    @IsNumber()
    page: number;

    @ApiPropertyOptional()
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
