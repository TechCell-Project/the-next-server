import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
    AddSerialNumberDto,
    AddSerialNumberResponseDto,
    CreateSkuDto,
    FilterSkuDto,
    QuerySkusDto,
    SkuInfinityPaginationResult,
    SortSkuDto,
} from './dtos';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkusService } from './skus.service';
import { infinityPagination } from '~/common/utils';
import { SKU } from './schemas';
import { ObjectIdParamDto } from '~/common';

@ApiTags('skus')
@ApiExtraModels(FilterSkuDto, SortSkuDto)
@Controller({
    path: 'skus',
})
export class SkusController {
    constructor(private readonly skusService: SkusService) {}

    @Post('/')
    @HttpCode(HttpStatus.NO_CONTENT)
    async createSku(@Body() data: CreateSkuDto) {
        return this.skusService.createSku(data);
    }

    @ApiOkResponse({
        type: SkuInfinityPaginationResult,
    })
    @Get('/')
    async getSkus(query: QuerySkusDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 50) {
            limit = 50;
        }

        return infinityPagination(
            await this.skusService.getSkus({
                filters: query?.filters,
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({
        type: SKU,
    })
    @Get('/:id')
    async getSPU(@Param() { id }: ObjectIdParamDto) {
        return this.skusService.getSkuById(id);
    }

    @ApiCreatedResponse({
        type: AddSerialNumberResponseDto,
    })
    @Post('/:id/serial-numbers')
    @HttpCode(HttpStatus.CREATED)
    async addSerialNumbers(
        @Param() { id }: ObjectIdParamDto,
        @Body() { serialNumbers }: AddSerialNumberDto,
    ) {
        return this.skusService.addSerialNumbers(id, serialNumbers);
    }
}
