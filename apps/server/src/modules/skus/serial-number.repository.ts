import { AbstractRepository, convertToObjectId, TPaginationOptions } from '~/common';
import { SerialNumber } from './schemas/serial-number.schema';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { SerialNumberStatusEnum } from './enums';
import { QuerySerialNumberDto } from './dtos';

export class SerialNumberRepository extends AbstractRepository<SerialNumber> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(SerialNumber.name) protected readonly serialNumberModel: Model<SerialNumber>,
        @InjectConnection() connection: Connection,
    ) {
        super(serialNumberModel, connection);
        this.logger.setContext(SerialNumberRepository.name);
    }

    addMany(skuId: Types.ObjectId, numbers: string[]) {
        return this.serialNumberModel.insertMany(
            numbers.map((number) => ({
                _id: new Types.ObjectId(),
                skuId,
                number,
                status: SerialNumberStatusEnum.Available,
            })),
        );
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: QuerySerialNumberDto['filters'] | null;
        sortOptions?: QuerySerialNumberDto['sort'] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<SerialNumber[]> {
        const where: FilterQuery<SerialNumber> = {};

        if (filterOptions?.skuId) {
            where.skuId = convertToObjectId(filterOptions.skuId);
        }

        if (filterOptions?.status?.length) {
            where.status = { $in: filterOptions.status.map((s) => s.toString()) };
        } else {
            where.status = SerialNumberStatusEnum.Available;
        }

        this.logger.info({ where }, 'sku-where');
        const serialsData = await this.serialNumberModel
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

        return serialsData.map((sku) => new SerialNumber(sku));
    }
}
