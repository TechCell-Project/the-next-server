import {
    Controller,
    Get,
    HttpStatus,
    SerializeOptions,
    HttpCode,
    Query,
    Param,
    Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUserDto, UserInfinityPaginationResult } from './dtos';
import { InfinityPaginationResultType, NullableType } from '~/common/types';
import { User } from './schemas';
import { infinityPagination } from '~/common/utils';
import { ObjectIdParamDto } from 'libs/common/dtos';
import { AuthRoles } from '../auth/guards';
import { instanceToPlain } from 'class-transformer';
import { JwtPayloadType } from '../auth/strategies/types';
import { UserRole } from './enums';

@ApiTags('users')
@ApiBearerAuth()
@Controller({
    path: '/users',
})
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @AuthRoles(UserRole.Manager)
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

    @AuthRoles()
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: User,
    })
    async findOne(
        @Param() { id }: ObjectIdParamDto,
        @Req() request: { user: JwtPayloadType },
    ): Promise<NullableType<User>> {
        const user = await this.usersService.findById(id);
        const { role } = request.user;
        const serializedUser = instanceToPlain(user, {
            groups: [role],
        });
        return serializedUser as NullableType<User>;
    }
}
