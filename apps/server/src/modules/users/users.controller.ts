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
import { ApiTags, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
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
import { RabbitMQService } from '~/common/rabbitmq';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { UsersPattern } from './users.pattern';
// import { UserRole } from './enums';

@ApiTags('users')
@ApiExtraModels(QueryUsersDto, FilterUserDto, SortUserDto)
@Controller({
    path: '/users',
})
@AuthRoles(UserRoleEnum.Manager)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly rabbitMqService: RabbitMQService,
    ) {}

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
        if (limit > 100) {
            limit = 100;
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

    @MessagePattern(UsersPattern.isImageInUse)
    async isImageInUse(
        @Ctx() context: RmqContext,
        @Payload() { publicId = '' }: { publicId: string },
    ) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.usersService.isImageInUse(publicId);
    }
}
