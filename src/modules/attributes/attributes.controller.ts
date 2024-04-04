import {
    Body,
    Controller,
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
    GetAttributesDto,
    SortAttributeDto,
    UpdateAttributeDto,
} from './dtos';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/guards';
import { UserRole } from '../users/enums';
import { ObjectIdParamDto, infinityPagination } from '~/common';
import { Attribute } from './schemas';

@ApiTags('attributes')
@ApiExtraModels(FilterAttributeDto, SortAttributeDto)
@ApiBearerAuth()
@Controller({
    path: 'attributes',
})
export class AttributesController {
    constructor(private readonly attributesService: AttributesService) {}

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
        groups: [UserRole.Warehouse],
    })
    @ApiOkResponse({
        type: AttributeInfinityPaginationResult,
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async getAttributes(@Query() query: GetAttributesDto) {
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

    @ApiOkResponse({ type: Attribute })
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
}
