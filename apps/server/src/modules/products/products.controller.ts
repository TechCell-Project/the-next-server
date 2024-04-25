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
import { ApiExtraModels, ApiOkResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('products')
@ApiExtraModels(QueryProductsDto, FilterProductsDto, SortProductsDto)
@Controller({
    path: '/products',
})
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @ApiOperation({
        description: 'Get product list with pagination and filter',
        summary: 'Get products',
    })
    @ApiOkResponse({
        type: ProductInfinityPaginationResult,
    })
    @Get('/')
    async getProducts(@Query() query: QueryProductsDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 20;
        if (limit > 100) {
            limit = 100;
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

    @ApiOperation({
        description: 'Get product by id',
        summary: 'Get product',
    })
    @ApiOkResponse({
        type: ProductDto,
    })
    @Get('/:productId')
    async getProductById(@Param('productId') productId: string) {
        return this.productsService.getProductById(productId);
    }
}
