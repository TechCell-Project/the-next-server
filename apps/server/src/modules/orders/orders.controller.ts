import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, infinityPagination, ObjectIdParamDto } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import {
    CreateOrderDto,
    OrderInfinityPaginationResult,
    PreviewOrderDto,
    PreviewOrderResponseDto,
    QueryOrdersDto,
    VnpayIpnUrlDTO,
} from './dtos';
import { AuthRoles } from '../auth/guards';
import { Order } from './schemas';

@ApiTags('orders')
@Controller({
    path: 'orders',
})
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

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

    @AuthRoles()
    @ApiOkResponse({
        type: Order,
    })
    @Get('/:id')
    async getOrderById(
        @CurrentUser() { userId }: JwtPayloadType,
        @Query() { id }: ObjectIdParamDto,
    ) {
        return this.ordersService.getOrderById({
            userId,
            orderId: id,
        });
    }
}
