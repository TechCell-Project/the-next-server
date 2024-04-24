import { Controller, Get, Param, Query, SerializeOptions } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { CurrentUser, infinityPagination, ObjectIdParamDto } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { FilterOrdersMntDto, QueryOrdersMntDto } from './dtos';
import { AuthRoles } from '../auth/guards';
import { UserRoleEnum } from '../users/enums';
import { OrdersMntService } from './orders-mnt.service';

@ApiTags('orders-mnt')
@ApiExtraModels(FilterOrdersMntDto, QueryOrdersMntDto)
@Controller({
    path: 'orders-mnt',
})
export class OrdersMntController {
    constructor(private readonly ordersMntService: OrdersMntService) {}

    @SerializeOptions({
        groups: [UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse)
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
        groups: [UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse],
    })
    @AuthRoles(UserRoleEnum.Sales, UserRoleEnum.Accountant, UserRoleEnum.Warehouse)
    @Get('/:id')
    async getOrdersMntById(@CurrentUser() user: JwtPayloadType, @Param() { id }: ObjectIdParamDto) {
        return this.ordersMntService.getOrdersMntById(user, id);
    }
}
