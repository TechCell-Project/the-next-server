import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { OrderStatusEnum } from '~/server/orders/enum';

class UpdateSerialNumberDto {
    @ApiProperty({
        type: String,
        format: 'ObjectId',
    })
    @IsString()
    @IsMongoId()
    skuId: string;

    @ApiProperty({
        type: String,
        isArray: true,
    })
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    serialNumbers: string[];
}

export class UpdateOrderStatusDto {
    @ApiProperty({
        type: String,
        enum: OrderStatusEnum,
    })
    @IsString()
    @IsEnum(OrderStatusEnum)
    orderStatus: string;

    @ApiProperty({
        type: String,
    })
    @IsString()
    note: string;

    @ApiPropertyOptional({
        type: [UpdateSerialNumberDto],
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => UpdateSerialNumberDto)
    updateSerialNumbers?: UpdateSerialNumberDto[];
}
