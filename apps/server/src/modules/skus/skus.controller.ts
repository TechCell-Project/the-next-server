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
import { AuthRoles } from '../auth/guards';

@ApiTags('skus')
@ApiExtraModels(FilterSkuDto, SortSkuDto)
@Controller({
    path: 'skus',
})
@AuthRoles()
export class SkusController {
    constructor(private readonly skusService: SkusService) {}

    @ApiCreatedResponse({
        type: SKU,
    })
    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    async createSku(@Body() data: CreateSkuDto) {
        return this.skusService.createSku(data);
    }

    @ApiOkResponse({
        type: SkuInfinityPaginationResult,
    })
    @Get('/')
    async getSkus(@Query() query: QuerySkusDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
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
    async getSkuById(@Param() { id }: ObjectIdParamDto) {
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

    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateSkuById(@Param() { id }: ObjectIdParamDto, @Body() data: CreateSkuDto) {
        return this.skusService.updateSkuById(id, data);
    }
}
