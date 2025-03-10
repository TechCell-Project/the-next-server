import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceDto } from '~/server/skus';
import { ImageSchema, SKU } from '~/server/skus/schemas';
import { AttributeInProductDto } from '~/server/spus/dtos';
import { SPU, SPUModelSchema } from '~/server/spus/schemas';
import { ProductsService } from '../products.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Brand } from '~/server/brands';

class VariationDto {
    constructor(model: SPUModelSchema, sku: SKU) {
        this.skuId = sku._id.toString();
        this.price = sku.price;
        this.attributes = sku?.attributes || [];
        if (sku.image) {
            this.image = {
                ...sku.image,
                isThumbnail: false,
            };
        }
        if (sku.tags) {
            this.tags = sku.tags.map((tag) => tag.toString());
        }
    }

    @ApiProperty({ type: String, format: 'ObjectId' })
    skuId: string;

    @ApiProperty({
        type: PriceDto,
    })
    price: PriceDto;

    @ApiProperty({
        isArray: true,
        type: AttributeInProductDto,
    })
    attributes: AttributeInProductDto[];

    @ApiPropertyOptional({
        type: ImageSchema,
    })
    image?: ImageSchema;

    @ApiProperty({
        type: String,
        isArray: true,
    })
    tags: string[];
}

export class ProductDto {
    constructor(spu: SPU, modelSlug: string, sku: SKU[], brand: Brand) {
        const model = spu.models.find((model) => model.slug === modelSlug);
        if (!model) {
            throw new HttpException(
                {
                    errors: {
                        model: 'Model not found ' + modelSlug,
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        this.productId = ProductsService.toProductId(spu._id, modelSlug);
        this.productName = model.name;
        this.brand = brand;
        this.description = model.description;
        this.attributes = [...(spu?.commonAttributes || []), ...(model?.attributes || [])];
        this.images = model?.images ?? [];
        this.variations = sku.map((sku) => new VariationDto(model, sku));
    }

    @ApiProperty({
        type: String,
        example: 'a_product_id',
    })
    productId: string;

    @ApiProperty({
        type: String,
        example: 'a product name',
    })
    productName: string;

    @ApiProperty({
        type: Brand,
    })
    brand: Brand;

    @ApiProperty({
        type: String,
        example: 'a generic description',
    })
    description: string;

    @ApiProperty({
        isArray: true,
        type: AttributeInProductDto,
    })
    attributes: AttributeInProductDto[];

    @ApiProperty({
        isArray: true,
        type: ImageSchema,
    })
    images: ImageSchema[];

    @ApiProperty({
        isArray: true,
        type: VariationDto,
    })
    variations: VariationDto[];
}
