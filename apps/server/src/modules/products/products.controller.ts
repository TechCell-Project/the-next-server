import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    FilterProductsDto,
    ProductDto,
    ProductInfinityPaginationResult,
    QueryProductsDto,
    SortProductsDto,
} from './dtos';
import { infinityPagination } from '~/common/utils';
import { ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@ApiExtraModels(FilterProductsDto, SortProductsDto)
@Controller({
    path: '/products',
})
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @ApiOkResponse({
        type: ProductInfinityPaginationResult,
    })
    @Get('/')
    async getProducts(@Query() query: QueryProductsDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 50) {
            limit = 50;
        }

        return infinityPagination(
            await this.productsService.getProducts({
                filters: query?.filters,
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({
        type: ProductDto,
    })
    @Get('/:productId')
    async getProductById(@Param('productId') productId: string) {
        return this.productsService.getProductById(productId);
    }
}
