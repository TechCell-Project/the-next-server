import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Cart, ProductCartSchema } from '../schemas';
import { Types } from 'mongoose';
import { IsMongoId, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductCartSchemaDTO extends OmitType(ProductCartSchema, ['createdAt', 'updatedAt']) {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    @Type(() => Types.ObjectId)
    skuId: Types.ObjectId;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    quantity: number;
}

export class UpdateCartDto extends PickType(Cart, ['products']) {
    @ApiProperty({
        type: ProductCartSchemaDTO,
        isArray: true,
    })
    @ValidateNested({ each: true })
    @Type(() => ProductCartSchemaDTO)
    products: ProductCartSchemaDTO[];
}
