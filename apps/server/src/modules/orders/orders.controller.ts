import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Ip,
    Param,
    Patch,
    Post,
    Query,
    Req,
    SerializeOptions,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
    ApiCreatedResponse,
    ApiExcludeEndpoint,
    ApiExtraModels,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, infinityPagination, ObjectIdParamDto } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import {
    CreateOrderDto,
    FilterOrdersDto,
    OrderInfinityPaginationResult,
    PreviewOrderDto,
    PreviewOrderResponseDto,
    QueryOrdersDto,
    VnpayIpnUrlDTO,
} from './dtos';
import { AuthRoles } from '../auth/guards';
import { Order } from './schemas';
import { UserRoleEnum } from '../users/enums';
import { CancelOrderDto } from './dtos/cancel-order.dto';

@ApiTags('orders')
@ApiExtraModels(QueryOrdersDto, FilterOrdersDto, QueryOrdersDto)
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

    @AuthRoles(UserRoleEnum.Customer)
    @ApiOkResponse({
        type: PreviewOrderResponseDto,
    })
    @Post('preview')
    @HttpCode(HttpStatus.OK)
    async previewOrder(@CurrentUser() { userId }: JwtPayloadType, @Body() body: PreviewOrderDto) {
        return this.ordersService.previewOrder(userId, body);
    }

    @AuthRoles(UserRoleEnum.Customer)
    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: Order,
    })
    async createOrder(
        @Ip() ip: string,
        @CurrentUser() { userId }: JwtPayloadType,
        @Body() body: CreateOrderDto,
    ) {
        return this.ordersService.createOrder({ userId, payload: body, ip });
    }

    @AuthRoles(UserRoleEnum.Customer)
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

    @AuthRoles(UserRoleEnum.Customer)
    @SerializeOptions({ groups: [UserRoleEnum.Customer] })
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

    @AuthRoles(UserRoleEnum.Customer)
    @SerializeOptions({ groups: [UserRoleEnum.Customer] })
    @Patch('/:id/cancel')
    @HttpCode(HttpStatus.NO_CONTENT)
    async cancelOrder(
        @Param() { id }: ObjectIdParamDto,
        @CurrentUser() { userId }: JwtPayloadType,
        @Body() body: CancelOrderDto,
    ) {
        return this.ordersService.cancelOrder({ orderId: id, userId, cancel: body });
    }
}
