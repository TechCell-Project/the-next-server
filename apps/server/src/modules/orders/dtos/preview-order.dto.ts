import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsEnum,
    IsMongoId,
    IsNumber,
    IsString,
    Max,
    Min,
    Validate,
    ValidateNested,
} from 'class-validator';
import { IsUniqueSkuIdInObject } from '../decorators';
import { PaymentMethodEnum } from '../enum';

export class ProductInOrderDto {
    @ApiProperty({
        type: String,
        example: '662175af9d10678911469e45',
    })
    @IsString()
    @IsMongoId()
    skuId: string;

    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNumber()
    @Min(1)
    @Max(1000)
    quantity: number;
}

export class PreviewOrderDto {
    @ApiProperty({
        isArray: true,
        type: ProductInOrderDto,
    })
    @ValidateNested({ each: true })
    @Type(() => ProductInOrderDto)
    @ArrayNotEmpty()
    @Validate(IsUniqueSkuIdInObject)
    products: ProductInOrderDto[];

    @ApiProperty({
        type: Number,
        example: 1,
        description: 'Index of address in user address list',
    })
    @IsNumber()
    addressIndex: number;

    @ApiProperty({
        type: String,
        enum: PaymentMethodEnum,
    })
    @IsEnum(PaymentMethodEnum)
    paymentMethod: string;
}
