import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Ip,
    Param,
    Post,
    Query,
    Req,
    SerializeOptions,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiExcludeEndpoint, ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, infinityPagination, ObjectIdParamDto } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import {
    CreateOrderDto,
    FilterOrdersDto,
    OrderInfinityPaginationResult,
    PreviewOrderDto,
    PreviewOrderResponseDto,
    QueryOrdersDto,
    QueryOrdersMntDto,
    VnpayIpnUrlDTO,
} from './dtos';
import { AuthRoles } from '../auth/guards';
import { Order } from './schemas';
import { UserRoleEnum } from '../users/enums';
import { OrdersMntService } from './orders-mnt.service';

@ApiTags('orders')
@ApiExtraModels(FilterOrdersDto, QueryOrdersDto)
@Controller({
    path: 'orders',
})
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly ordersMntService: OrdersMntService,
    ) {}

    @ApiExcludeEndpoint()
    @Get('/vnpay-ipn')
    async vnpayIpnUrl(@Req() { query }: { query: VnpayIpnUrlDTO }) {
        return this.ordersService.verifyVnpayIpn(query);
    }

    @AuthRoles()
    @ApiOkResponse({
        type: PreviewOrderResponseDto,
    })
    @Post('preview')
    @HttpCode(HttpStatus.OK)
    async previewOrder(@CurrentUser() { userId }: JwtPayloadType, @Body() body: PreviewOrderDto) {
        return this.ordersService.previewOrder(userId, body);
    }

    @AuthRoles()
    @Post('/')
    @HttpCode(HttpStatus.OK)
    async createOrder(
        @Ip() ip: string,
        @CurrentUser() { userId }: JwtPayloadType,
        @Body() body: CreateOrderDto,
    ) {
        return this.ordersService.createOrder({ userId, payload: body, ip });
    }

    @SerializeOptions({ groups: [UserRoleEnum.Customer] })
    @AuthRoles()
    @ApiOkResponse({
        type: OrderInfinityPaginationResult,
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async getOrders(@CurrentUser() { userId }: JwtPayloadType, @Query() query: QueryOrdersDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        }

        return infinityPagination(
            await this.ordersService.getOrders(userId, {
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
        groups: [UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse)
    @Get('/mnt')
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

    @SerializeOptions({ groups: [UserRoleEnum.Customer] })
    @AuthRoles()
    @ApiOkResponse({
        type: Order,
    })
    @Get('/:id')
    async getOrderById(
        @CurrentUser() { userId }: JwtPayloadType,
        @Param() { id }: ObjectIdParamDto,
    ) {
        return this.ordersService.getOrderById({
            userId,
            orderId: id,
        });
    }
}
