import { AbstractRepository, TPaginationOptions } from '~/common';
import { SPU } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { QuerySpusDto } from './dtos';

export class SPURepository extends AbstractRepository<SPU> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(SPU.name) protected readonly spuModel: Model<SPU>,
        @InjectConnection() connection: Connection,
    ) {
        super(spuModel, connection);
    }

    async isExistSpuSlug(slug: string): Promise<boolean> {
        const result = await this.findOne({
            filterQuery: {
                slug,
            },
        });
        return !!result;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: QuerySpusDto['filters'] | null;
        sortOptions?: QuerySpusDto['sort'] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<SPU[]> {
        const where: FilterQuery<SPU> = {};
        if (filterOptions) {
        }

        const spusData = await this.spuModel
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

        return spusData.map((spu) => new SPU(spu));
    }
}
