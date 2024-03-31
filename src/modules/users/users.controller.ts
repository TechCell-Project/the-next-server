import { Controller, Get, HttpStatus, SerializeOptions, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUserDto, UserInfinityPaginationResult } from './dtos';
import { InfinityPaginationResultType } from '~/common/types';
import { User } from './schemas';
import { infinityPagination } from '~/common/utils';

@ApiTags('users')
@ApiBearerAuth()
@Controller({
    path: '/users',
})
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @SerializeOptions({
        groups: ['manager'],
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: UserInfinityPaginationResult,
    })
    async findAll(@Query() query: QueryUserDto): Promise<InfinityPaginationResultType<User>> {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 50) {
            limit = 50;
        }

        return infinityPagination(
            await this.usersService.findManyWithPagination({
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
}
