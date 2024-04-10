import { AbstractRepository, TPaginationOptions } from '~/common';
import { SKU } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { QuerySkusDto } from './dtos';
import { SkuStatusEnum } from './skus.enum';

export class SkusRepository extends AbstractRepository<SKU> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(SKU.name) protected readonly skuModel: Model<SKU>,
        @InjectConnection() connection: Connection,
    ) {
        super(skuModel, connection);
        this.logger.setContext(SkusRepository.name);
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: QuerySkusDto['filters'] | null;
        sortOptions?: QuerySkusDto['sort'] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<SKU[]> {
        const where: FilterQuery<SKU> = {};
        if (filterOptions?.status?.length) {
            where.status = { $in: filterOptions.status.map((s) => s.toString()) };
        } else {
            where.status = { $ne: SkuStatusEnum.Deleted };
        }

        const skusData = await this.skuModel
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

        return skusData.map((sku) => new SKU(sku));
    }
}
