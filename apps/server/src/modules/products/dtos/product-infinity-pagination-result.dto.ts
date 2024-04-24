import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '~/common/types';
import { PriceDto } from '~/server/skus';
import { ImageSchema } from '~/server/skus/schemas';
import { Tag } from '~/server/tags';

export class ProductInListDto {
    constructor(data: ProductInListDto) {
        Object.assign(this, data);
    }

    @ApiProperty({ type: String, description: 'id of product' })
    id: string;

    @ApiProperty({ type: String, description: 'id of sku' })
    skuId: string;

    @ApiProperty({ type: String, description: 'name of product' })
    name: string;

    @ApiProperty({ type: String, description: 'name of model' })
    modelName: string;

    @ApiProperty({ type: String, description: 'name of brand' })
    brandName: string;

    @ApiProperty({ type: PriceDto })
    price: PriceDto;

    @ApiProperty({ type: [ImageSchema] })
    images: ImageSchema[];

    @ApiPropertyOptional({ type: Tag, isArray: true })
    tags?: Tag[];
}

export class ProductInfinityPaginationResult
    implements InfinityPaginationResultType<ProductInListDto>
{
    @ApiProperty({
        type: [ProductInListDto],
    })
    readonly data: ProductInListDto[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: ProductInListDto[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
