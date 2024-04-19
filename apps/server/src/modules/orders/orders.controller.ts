import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { PreviewOrderDto, PreviewOrderResponseDto } from './dtos';
import { AuthRoles } from '../auth/guards';

@ApiTags('orders')
@Controller({
    path: 'orders',
})
@AuthRoles()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @ApiOkResponse({
        type: PreviewOrderResponseDto,
    })
    @Post('preview')
    @HttpCode(HttpStatus.OK)
    async previewOrder(@CurrentUser() { userId }: JwtPayloadType, @Body() body: PreviewOrderDto) {
        return this.ordersService.previewOrder(userId, body);
    }
}
