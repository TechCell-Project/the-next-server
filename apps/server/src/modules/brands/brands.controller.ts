import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import {
    BrandInfinityPaginationResult,
    CreateBrandDto,
    FilterBrandsDto,
    QueryBrandsDto,
    UpdateBrandDto,
} from './dtos';
import { ObjectIdParamDto, infinityPagination } from '~/common';
import { BrandStatusEnum } from './enums';
import { AuthRoles } from '../auth/guards';
import { Brand } from './schemas';
import { SortAttributeDto } from '../attributes/dtos';

@ApiTags('brands')
@ApiExtraModels(QueryBrandsDto, FilterBrandsDto, SortAttributeDto)
@Controller({
    path: 'brands',
})
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) {}

    @AuthRoles()
    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    async createBrand(@Body() data: CreateBrandDto) {
        return this.brandsService.createBrand(data);
    }

    @ApiOkResponse({
        type: BrandInfinityPaginationResult,
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async getBrands(@Query() query: QueryBrandsDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        }

        return infinityPagination(
            await this.brandsService.findManyWithPagination({
                filterOptions: query?.filters,
                sortOptions: query?.sort,
                paginationOptions: {
                    page,
                    limit,
                },
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({
        type: Brand,
    })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getBrand(@Param() { id }: ObjectIdParamDto) {
        return this.brandsService.getBrandById(id);
    }

    @AuthRoles()
    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateBrand(@Param() { id }: ObjectIdParamDto, @Body() data: UpdateBrandDto) {
        return this.brandsService.updateBrand(id, data);
    }

    @AuthRoles()
    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBrand(@Param() { id }: ObjectIdParamDto) {
        return this.brandsService.updateBrand(id, {
            status: BrandStatusEnum.Inactive,
        });
    }
}
