import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { CreateOrderDto, PreviewOrderDto, PreviewOrderResponseDto, VnpayIpnUrlDTO } from './dtos';
import { AuthRoles } from '../auth/guards';

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
}
