import { Injectable } from '@nestjs/common';
import { TagRepository } from './tags.repository';
import { CreateTagDto, QueryTagsDto, UpdateTagDto } from './dtos';
import { convertToObjectId, getSlugFromName, sanitizeHtmlString } from '~/common/utils';
import { Tag } from './schemas';

@Injectable()
export class TagsService {
    constructor(private readonly tagRepository: TagRepository) {}

    async createTag({ description, ...data }: CreateTagDto) {
        const slug = await this.generateUniqueSlug(data.name);
        const descriptionSanitized = sanitizeHtmlString(description);

        return this.tagRepository.create({
            document: {
                ...data,
                slug,
                description: descriptionSanitized,
            },
        });
    }

    async getTags(payload: QueryTagsDto): Promise<Tag[]> {
        return this.tagRepository.findManyWithPagination({
            filterOptions: payload?.filters,
            sortOptions: payload?.sort,
            paginationOptions: {
                limit: payload?.limit,
                page: payload?.page,
            },
        });
    }

    async getTagById(id: string): Promise<Tag> {
        return this.tagRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
    }

    async updateTag(id: string, data: UpdateTagDto) {
        await this.tagRepository.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(id) },
            updateQuery: {
                ...data,
                description: sanitizeHtmlString(data.description),
            },
        });
    }

    private async generateUniqueSlug(name: CreateTagDto['name']) {
        let uniqSlug = getSlugFromName(name, false);

        while ((await this.tagRepository.count({ slug: uniqSlug })) > 0) {
            uniqSlug = `${getSlugFromName(name)}`;
        }
        return uniqSlug;
    }
}
