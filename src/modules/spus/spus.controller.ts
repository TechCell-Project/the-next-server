import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { SPUService } from './spus.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ObjectIdParamDto, infinityPagination } from '~/common';
import { CreateSpuDto, QuerySpusDto, SpuInfinityPaginationResult } from './dtos';
import { SPU } from './schemas';

@ApiTags('spus')
@Controller({
    path: 'spus',
})
export class SPUController {
    constructor(private readonly spuService: SPUService) {}

    @Post('/')
    @HttpCode(HttpStatus.NO_CONTENT)
    async createSPU(@Body() data: CreateSpuDto) {
        return this.spuService.createSPU(data);
    }

    @ApiOkResponse({
        type: SpuInfinityPaginationResult,
    })
    @Get('/')
    async getSPUs(@Query() query: QuerySpusDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 50) {
            limit = 50;
        }

        return infinityPagination(
            await this.spuService.getSpus({
                filters: query?.filters,
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({
        type: SPU,
    })
    @Get('/:id')
    async getSPU(@Param() { id }: ObjectIdParamDto) {
        return this.spuService.getSpuById(id);
    }
}
