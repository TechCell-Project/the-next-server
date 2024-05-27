import { AbstractRepository, TPaginationOptions } from '~/common';
import { Attribute } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { CreateAttributeDto } from './dtos';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AttributeStatusEnum } from './attribute.enum';
import { QueryAttributesDto } from './dtos/query-attributes.dto';
import { createRegex } from '@vn-utils/text';

export class AttributesRepository extends AbstractRepository<Attribute> {
    constructor(
        @InjectModel(Attribute.name) protected readonly attributeModel: Model<Attribute>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
    ) {
        super(attributeModel, connection);
        this.logger.setContext(AttributesRepository.name);
    }

    async createAttribute(payload: CreateAttributeDto) {
        const isExist = await this.isExistsLabel(payload.label);
        if (isExist) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        label: 'alreadyExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        return this.create({
            document: {
                ...payload,
                status: AttributeStatusEnum.Available,
                unit: payload?.unit ? payload.unit : '',
            },
        });
    }

    async isExistsLabel(label: string) {
        const attribute = await this.findOne({ filterQuery: { label } });
        return !!attribute;
    }

    async findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
    }: {
        filterOptions?: QueryAttributesDto['filters'] | null;
        sortOptions?: QueryAttributesDto['sort'] | null;
        paginationOptions: TPaginationOptions;
    }): Promise<Attribute[]> {
        const where: FilterQuery<Attribute> = {};
        if (filterOptions?.label) {
            where.label = filterOptions.label;
        }

        if (filterOptions?.status?.length) {
            where.status = {
                $in: filterOptions.status.map((status) => status.toString()),
            };
        } else {
            where.status = { $ne: AttributeStatusEnum.Deleted };
        }

        if (filterOptions?.name) {
            where.name = createRegex(filterOptions.name);
        }

        if (filterOptions?.unit) {
            where.unit = createRegex(filterOptions.unit);
        }

        if (filterOptions?.keyword) {
            const keywordsRegex = createRegex(filterOptions.keyword);
            where.$or = [
                { name: keywordsRegex },
                { description: keywordsRegex },
                { label: keywordsRegex },
                { unit: keywordsRegex },
            ];
        }

        const attributesData = await this.attributeModel
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

        return attributesData.map((attribute) => new Attribute(attribute));
    }
}
