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
@ApiExtraModels(QueryAttributesDto, FilterAttributeDto, SortAttributeDto)
@Controller({
    path: 'attributes',
})
export class AttributesController {
    constructor(private readonly attributesService: AttributesService) {}

    @ApiCreatedResponse({
        description: 'Attribute created',
    })
    @AuthRoles(UserRoleEnum.DataEntry)
    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    async createAttribute(@Body() payload: CreateAttributeDto) {
        return this.attributesService.createAttribute(payload);
    }

    @SerializeOptions({
        groups: [UserRoleEnum.DataEntry],
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
        if (limit > 100) {
            limit = 100;
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

    @AuthRoles(UserRoleEnum.DataEntry)
    @ApiNoContentResponse({
        description: 'Update attribute successfully',
    })
    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateAttribute(@Param() { id }: ObjectIdParamDto, @Body() payload: UpdateAttributeDto) {
        return this.attributesService.updateAttribute(id, payload);
    }

    @AuthRoles(UserRoleEnum.DataEntry)
    @ApiNoContentResponse({
        description: 'Delete attribute successfully',
    })
    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAttribute(@Param() { id }: ObjectIdParamDto) {
        return this.attributesService.updateAttribute(id, { status: AttributeStatusEnum.Deleted });
    }
}
