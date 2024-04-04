import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { UserRole } from '../enums';
import { User } from '../schemas';
import { SortCase } from '~/common/enums';

export class FilterUserDto {
    @ApiPropertyOptional({
        type: [UserRole],
        enum: UserRole,
        example: [UserRole.Accountant, UserRole.DataEntry],
    })
    @IsOptional()
    roles?: UserRole[] | null;
}

export class SortUserDto {
    @ApiProperty({
        type: String,
        description: 'Key of User',
    })
    @Type(() => String)
    @IsString()
    orderBy: keyof User;

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

export class QueryUserDto {
    @ApiPropertyOptional()
    @Transform(({ value }) => (value ? Number(value) : 1))
    @IsNumber()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional()
    @Transform(({ value }) => (value ? Number(value) : 10))
    @IsNumber()
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ type: String, description: `JSON string of ${FilterUserDto.name}` })
    @IsOptional()
    @Transform(({ value }) =>
        value ? plainToInstance(FilterUserDto, JSON.parse(value)) : undefined,
    )
    @ValidateNested()
    @Type(() => FilterUserDto)
    filters?: FilterUserDto | null;

    @ApiPropertyOptional({ type: String, description: `JSON string of ${SortUserDto.name}` })
    @IsOptional()
    @Transform(({ value }) => {
        return value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined;
    })
    @ValidateNested({ each: true })
    @Type(() => SortUserDto)
    sort?: SortUserDto[] | null;
}
