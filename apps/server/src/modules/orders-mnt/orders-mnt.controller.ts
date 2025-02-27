import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    SerializeOptions,
} from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, infinityPagination, ObjectIdParamDto } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { FilterOrdersMntDto, QueryOrdersMntDto, SortOrdersMntDto } from './dtos';
import { AuthRoles } from '../auth/guards';
import { UserRoleEnum } from '../users/enums';
import { OrdersMntService } from './orders-mnt.service';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderInfinityPaginationResult } from '../orders/dtos';
import { Order } from '../orders/schemas';

@ApiTags('orders-mnt')
@ApiExtraModels(QueryOrdersMntDto, FilterOrdersMntDto, SortOrdersMntDto)
@Controller({
    path: 'orders-mnt',
})
export class OrdersMntController {
    constructor(private readonly ordersMntService: OrdersMntService) {}

    @SerializeOptions({
        groups: [UserRoleEnum.Sales, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Warehouse)
    @ApiOkResponse({
        type: OrderInfinityPaginationResult,
    })
    @Get('/')
    async getOrdersMnt(@CurrentUser() user: JwtPayloadType, @Query() query: QueryOrdersMntDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        }
        return infinityPagination(
            await this.ordersMntService.getOrdersMnt(user, {
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

    @SerializeOptions({
        groups: [UserRoleEnum.Sales, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Warehouse)
    @ApiOkResponse({
        type: Order,
    })
    @Get('/:id')
    async getOrdersMntById(@CurrentUser() user: JwtPayloadType, @Param() { id }: ObjectIdParamDto) {
        return this.ordersMntService.getOrdersMntById(user, id);
    }

    @SerializeOptions({
        groups: [UserRoleEnum.Sales, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Warehouse)
    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateOrderStatus(
        @CurrentUser() user: JwtPayloadType,
        @Param() { id }: ObjectIdParamDto,
        @Body() data: UpdateOrderStatusDto,
    ) {
        return this.ordersMntService.updateOrderStatus(user, id, data);
    }
}
