import {
    Controller,
    Get,
    HttpStatus,
    SerializeOptions,
    HttpCode,
    Query,
    Param,
    Post,
    Body,
    Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
    CreateUserDto,
    QueryUsersDto,
    UserInfinityPaginationResult,
    UpdateUserMntDto,
    FilterUserDto,
    SortUserDto,
} from './dtos';
import { InfinityPaginationResultType, NullableType } from '~/common/types';
import { User } from './schemas';
import { convertToObjectId, infinityPagination } from '~/common/utils';
import { ObjectIdParamDto } from '~/common/dtos';
import { AuthRoles } from '../auth/guards';
import { instanceToPlain } from 'class-transformer';
import { JwtPayloadType } from '../auth/strategies/types';
import { UserRoleEnum } from './enums';
import { CurrentUser } from '~/common/decorators';
// import { UserRole } from './enums';

@ApiTags('users')
@ApiBearerAuth()
@ApiExtraModels(FilterUserDto, SortUserDto)
@Controller({
    path: '/users',
})
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // @AuthRoles()
    @AuthRoles(UserRoleEnum.Manager)
    @SerializeOptions({
        groups: [UserRoleEnum.Manager],
    })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOkResponse({
        type: User,
    })
    create(@Body() createProfileDto: CreateUserDto): Promise<NullableType<User>> {
        return this.usersService.create(createProfileDto);
    }

    @AuthRoles()
    // @AuthRoles(UserRole.Manager)
    @SerializeOptions({
        groups: [UserRoleEnum.Manager],
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: UserInfinityPaginationResult,
    })
    async getUsers(@Query() query: QueryUsersDto): Promise<InfinityPaginationResultType<User>> {
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
    async getUserId(
        @Param() { id }: ObjectIdParamDto,
        @CurrentUser() { role }: JwtPayloadType,
    ): Promise<NullableType<User>> {
        const user = await this.usersService.usersRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
        const serializedUser = instanceToPlain(user, {
            groups: [role],
        });
        return serializedUser as NullableType<User>;
    }

    // @AuthRoles()
    @AuthRoles(UserRoleEnum.Manager)
    @SerializeOptions({
        groups: [UserRoleEnum.Manager],
    })
    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOkResponse({
        type: User,
    })
    updateUserMnt(
        @Body() updateProfileDto: UpdateUserMntDto,
        @Param() { id }: ObjectIdParamDto,
        @CurrentUser() user: JwtPayloadType,
    ): Promise<void> {
        return this.usersService.updateUserMnt(id, user.userId, updateProfileDto);
    }
}
