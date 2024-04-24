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
    FilterSerialNumberDto,
    FilterSkuDto,
    QuerySerialNumberDto,
    QuerySkusDto,
    SkuInfinityPaginationResult,
    SortSerialNumberDto,
    SortSkuDto,
    UpdateSkuDto,
} from './dtos';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkusService } from './skus.service';
import { infinityPagination } from '~/common/utils';
import { SKU } from './schemas';
import { ObjectIdParamDto } from '~/common';
import { AuthRoles } from '../auth/guards';
import { SerialNumber } from './schemas/serial-number.schema';
import { UserRoleEnum } from '../users/enums';

@ApiTags('skus')
@ApiExtraModels(FilterSkuDto, SortSkuDto, FilterSerialNumberDto, SortSerialNumberDto)
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

    @AuthRoles(UserRoleEnum.Warehouse)
    @ApiOkResponse({
        type: SerialNumber,
        isArray: true,
    })
    @Get('/:id/serial-numbers')
    async getSerialNumbers(
        @Param() { id }: ObjectIdParamDto,
        @Query() query: QuerySerialNumberDto,
    ) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        }

        return infinityPagination(
            await this.skusService.getSerialNumbersWithPagination({
                filters: { ...query?.filters, skuId: id },
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @AuthRoles(UserRoleEnum.Warehouse)
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
    async updateSkuById(@Param() { id }: ObjectIdParamDto, @Body() data: UpdateSkuDto) {
        return this.skusService.updateSkuById(id, data);
    }
}
