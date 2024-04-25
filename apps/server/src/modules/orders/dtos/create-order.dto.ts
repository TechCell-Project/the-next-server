import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PreviewOrderDto } from './preview-order.dto';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { isTrueSet } from '~/common';

export class CreateOrderDto extends IntersectionType(PreviewOrderDto) {
    @ApiProperty({ example: 'Bọc kĩ giúp em nha!', type: String })
    @IsOptional()
    @IsString()
    orderNote?: string;

    @ApiProperty({ example: 'Giao lúc chiều nha ạ!', type: String })
    @IsOptional()
    @IsString()
    shipNote?: string;

    @ApiProperty({
        description: 'The return url after payment success',
        example: 'http://localhost:3000/order/123',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsUrl({ require_tld: false }) // allow localhost
    paymentReturnUrl: string;

    @ApiProperty({
        type: Boolean,
        example: true,
        description: 'If true, it will be selected from cart',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => isTrueSet(value))
    @Type(() => Boolean)
    isSelectFromCart?: boolean;
}
