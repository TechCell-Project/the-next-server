import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '~/common/types';
import { PriceDto } from '~/server/skus';
import { ImageSchemaDto } from '~/server/spus/dtos';

export class ProductInListDto {
    constructor(data: ProductInListDto) {
        this.name = data.name;
        this.brandName = data.brandName;
        this.price = data.price;
        this.images = data.images;
    }

    @ApiProperty({ type: String, description: 'name of product' })
    name: string;

    @ApiProperty({ type: String, description: 'name of model' })
    modelName: string;

    @ApiProperty({ type: String, description: 'name of brand' })
    brandName: string;

    @ApiProperty({ type: PriceDto })
    price: PriceDto;

    @ApiProperty({ type: [ImageSchemaDto] })
    images: ImageSchemaDto[];

    @ApiProperty({ type: [String] })
    tags: string[];
}

export class BrandInfinityPaginationResult
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
