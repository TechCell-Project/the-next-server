import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    SerializeOptions,
} from '@nestjs/common';
import { AttributesService } from './attributes.service';
import {
    AttributeInfinityPaginationResult,
    CreateAttributeDto,
    FilterAttributeDto,
    QueryAttributesDto,
    SortAttributeDto,
    UpdateAttributeDto,
} from './dtos';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/guards';
import { UserRoleEnum } from '../users/enums';
import { ObjectIdParamDto, infinityPagination } from '~/common';
import { Attribute } from './schemas';
import { AttributeStatusEnum } from './attribute.enum';

@ApiTags('attributes')
@ApiExtraModels(FilterAttributeDto, SortAttributeDto)
@ApiBearerAuth()
@Controller({
    path: 'attributes',
})
export class AttributesController {
    constructor(private readonly attributesService: AttributesService) {}

    @ApiCreatedResponse({
        description: 'Attribute created',
    })
    @AuthRoles()
    // @AuthRoles(UserRole.Warehouse)
    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    async createAttribute(@Body() payload: CreateAttributeDto) {
        return this.attributesService.createAttribute(payload);
    }

    @AuthRoles()
    // @AuthRoles(UserRole.Warehouse)
    @SerializeOptions({
        groups: [UserRoleEnum.Warehouse],
    })
    @ApiOkResponse({
        description: 'Get attributes successfully',
        type: AttributeInfinityPaginationResult,
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async getAttributes(@Query() query: QueryAttributesDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 50) {
            limit = 50;
        }

        return infinityPagination(
            await this.attributesService.getAttributes({
                filters: query?.filters,
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({ type: Attribute, description: 'Get attribute successfully' })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getAttribute(@Param() { id }: ObjectIdParamDto) {
        return this.attributesService.getAttribute(id);
    }

    @AuthRoles()
    // @AuthRoles(UserRole.Warehouse)
    @ApiNoContentResponse({
        description: 'Update attribute successfully',
    })
    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateAttribute(@Param() { id }: ObjectIdParamDto, @Body() payload: UpdateAttributeDto) {
        return this.attributesService.updateAttribute(id, payload);
    }

    @AuthRoles()
    // @AuthRoles(UserRole.Warehouse)
    @ApiNoContentResponse({
        description: 'Delete attribute successfully',
    })
    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAttribute(@Param() { id }: ObjectIdParamDto) {
        return this.attributesService.updateAttribute(id, { status: AttributeStatusEnum.Deleted });
    }
}