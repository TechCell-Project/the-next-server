import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { SpusService } from './spus.service';
import { ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ObjectIdParamDto, SlugParamDto, infinityPagination } from '~/common';
import {
    CreateSpuDto,
    QuerySpusDto,
    SpuInfinityPaginationResult,
    FilterSpuDto,
    SortSpuDto,
    UpdateSpuDto,
    AddSpuModelDto,
    UpdateSPUModelSchemaDto,
} from './dtos';
import { SPU } from './schemas';

@ApiTags('spus')
@ApiExtraModels(FilterSpuDto, SortSpuDto)
@Controller({
    path: 'spus',
})
export class SPUController {
    constructor(private readonly spusService: SpusService) {}

    @Post('/')
    @HttpCode(HttpStatus.NO_CONTENT)
    async createSPU(@Body() data: CreateSpuDto) {
        return this.spusService.createSPU(data);
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
            await this.spusService.getSpus({
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
        return this.spusService.getSpuById(id);
    }

    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateSPU(@Param() { id }: ObjectIdParamDto, @Body() data: UpdateSpuDto) {
        return this.spusService.updateSpu(id, data);
    }

    @Post('/:id/models')
    @HttpCode(HttpStatus.NO_CONTENT)
    async addSpuModels(@Param() { id }: ObjectIdParamDto, @Body() data: AddSpuModelDto) {
        return this.spusService.addSpuModels(id, data);
    }

    @Patch('/:id/models/:slug')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateSpuModel(
        @Param() { id }: ObjectIdParamDto,
        @Param() { slug }: SlugParamDto,
        @Body() data: UpdateSPUModelSchemaDto,
    ) {
        return this.spusService.updateSpuModel(id, slug, data);
    }
}
