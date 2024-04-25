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
import { ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
    CreateTagDto,
    FilterTagDto,
    QueryTagsDto,
    SortTagDto,
    TagInfinityPaginationResult,
    UpdateTagDto,
} from './dtos';
import { TagsService } from './tags.service';
import { infinityPagination } from '~/common/utils';
import { UserRoleEnum } from '../users/enums';
import { ObjectIdParamDto } from '~/common';
import { Tag } from './schemas';

@ApiTags('tags')
@ApiExtraModels(QueryTagsDto, FilterTagDto, SortTagDto)
@Controller({
    path: 'tags',
})
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post('/')
    @HttpCode(HttpStatus.NO_CONTENT)
    async createTag(@Body() data: CreateTagDto) {
        return await this.tagsService.createTag(data);
    }

    @SerializeOptions({
        groups: [UserRoleEnum.Warehouse],
    })
    @ApiOkResponse({
        description: 'Get tags successfully',
        type: TagInfinityPaginationResult,
    })
    @Get('/')
    @HttpCode(HttpStatus.OK)
    async getTags(@Query() query: QueryTagsDto) {
        const page = query?.page ?? 1;
        let limit = query?.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        }

        return infinityPagination(
            await this.tagsService.getTags({
                filters: query?.filters,
                sort: query?.sort,
                limit,
                page,
            }),
            { page, limit },
        );
    }

    @ApiOkResponse({ type: Tag, description: 'Get tag successfully' })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async getTag(@Param() { id }: ObjectIdParamDto) {
        return this.tagsService.getTagById(id);
    }

    @Patch('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateTag(@Param() { id }: ObjectIdParamDto, @Body() data: UpdateTagDto) {
        return this.tagsService.updateTag(id, data);
    }
}
