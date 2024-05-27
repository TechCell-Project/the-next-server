import { AbstractRepository, TPaginationOptions } from '~/common';
import { Tag } from './schemas';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';
import { QueryTagsDto } from './dtos';
import { TagStatusEnum } from './status.enum';
import { createRegex } from '@vn-utils/text';

export class TagRepository extends AbstractRepository<Tag> {
    constructor(
        @InjectModel(Tag.name) protected readonly tagModel: Model<Tag>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
    ) {
        super(tagModel, connection);
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: QueryTagsDto['filters'] | null;
        sortOptions?: QueryTagsDto['sort'] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Tag[]> {
        const where: FilterQuery<Tag> = {};
        if (filterOptions?.slug) {
            where.label = filterOptions.slug;
        }

        if (filterOptions?.status?.length) {
            where.status = {
                $in: filterOptions.status.map((status) => status.toString()),
            };
        } else {
            where.status = { $ne: TagStatusEnum.Deleted };
        }

        if (filterOptions?.keyword) {
            const keywordRegex = createRegex(filterOptions.keyword);
            where.$or = [{ name: keywordRegex }, { description: keywordRegex }];
        }

        this.logger.info(where);

        const attributesData = await this.tagModel
            .find(where)
            .sort(
                sortOptions?.reduce(
                    (accumulator, sort) => ({
                        ...accumulator,
                        [sort.orderBy]: sort.order.toUpperCase() === 'ASC' ? 1 : -1,
                    }),
                    {},
                ),
            )
            .skip((paginationOptions.page - 1) * paginationOptions.limit)
            .limit(paginationOptions.limit)
            .lean(true);

        return attributesData.map((tag) => new Tag(tag));
    }
}
