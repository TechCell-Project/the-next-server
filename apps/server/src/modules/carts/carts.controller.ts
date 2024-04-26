import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/guards';
import { CartsService } from './carts.service';
import { Cart } from './schemas';
import { CurrentUser } from '~/common/decorators';
import { JwtPayloadType } from '../auth/strategies/types';
import { UpdateCartDto } from './dtos';
import { UserRoleEnum } from '../users/enums';

@ApiBadRequestResponse({
    description: 'Invalid request, please check your request data!',
})
@ApiNotFoundResponse({
    description: 'Not found data, please try again!',
})
@ApiTooManyRequestsResponse({
    description: 'Too many requests, please try again later!',
})
@ApiInternalServerErrorResponse({
    description: 'Internal server error, please try again later!',
})
@ApiTags('carts')
@Controller({
    path: 'carts',
})
@AuthRoles(UserRoleEnum.Customer)
export class CartsController {
    constructor(private readonly cartsService: CartsService) {}

    @ApiOperation({
        summary: 'Get list of carts',
        description: 'Get list of carts',
    })
    @ApiOkResponse({ description: 'Carts found!', type: Cart })
    @Get('/')
    async getCarts(@CurrentUser() user: JwtPayloadType) {
        return this.cartsService.getCarts(user.userId);
    }

    @ApiOperation({
        summary: 'Add/update cart',
        description:
            'Add/update cart. If user already has cart, it will be updated. Set quantity to 0 to remove product from cart',
    })
    @ApiOkResponse({ description: 'Cart added!' })
    @HttpCode(200)
    @Post('/')
    async updateCart(@Body() data: UpdateCartDto, @CurrentUser() { userId }: JwtPayloadType) {
        return this.cartsService.updateCart({ data, userId });
    }
}
