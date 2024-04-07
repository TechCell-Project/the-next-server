import { AbstractRepository, TPaginationOptions } from '~/common';
import { Brand } from './schemas';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';
import { FilterBrandsDto, SortBrandsDto } from './dtos';

export class BrandsRepository extends AbstractRepository<Brand> {
    constructor(
        @InjectModel(Brand.name) protected readonly brandModel: Model<Brand>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
    ) {
        super(brandModel, connection);
        this.logger.setContext(BrandsRepository.name);
    }

    async isSlugExists(slug: string): Promise<boolean> {
        const brand = await this.findOne({ filterQuery: { slug } });
        return !!brand;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: FilterBrandsDto | null;
        sortOptions?: SortBrandsDto[] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Brand[]> {
        const where: FilterQuery<Brand> = {};
        if (filterOptions?.status?.length) {
            where['status'] = {
                $in: filterOptions.status.map((status) => status.toString()),
            };
        }

        const brandObjects = await this.brandModel
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

        return brandObjects.map((userObject) => new Brand(userObject));
    }
}
