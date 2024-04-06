import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AttributesRepository } from './attributes.repository';
import { CreateAttributeDto, QueryAttributesDto, UpdateAttributeDto } from './dtos';
import { Attribute } from './schemas';
import { convertToObjectId } from '~/common';
import { AttributeStatus } from './attribute.enum';
import { AttributeInProductSchema } from '../spus/schemas';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AttributesService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly attributesRepository: AttributesRepository,
    ) {}

    async createAttribute(payload: CreateAttributeDto): Promise<void> {
        await this.attributesRepository.createAttribute(payload);
    }

    async getAttributes(payload: QueryAttributesDto): Promise<Attribute[]> {
        return this.attributesRepository.findManyWithPagination({
            filterOptions: {
                status: AttributeStatus.Available,
                ...payload?.filters,
            },
            sortOptions: payload?.sort,
            paginationOptions: {
                limit: payload?.limit,
                page: payload?.page,
            },
        });
    }

    async getAttribute(id: string): Promise<Attribute> {
        return new Attribute(
            await this.attributesRepository.findOneOrThrow({
                filterQuery: { _id: convertToObjectId(id) },
            }),
        );
    }

    async updateAttribute(id: string, payload: UpdateAttributeDto): Promise<void> {
        await this.attributesRepository.findOneAndUpdateOrThrow({
            filterQuery: { _id: convertToObjectId(id) },
            updateQuery: payload,
        });
    }

    async validateAttributes(
        payload: AttributeInProductSchema[],
    ): Promise<AttributeInProductSchema[]> {
        const keyList = Array.from(payload, (attribute) => attribute.k.toLowerCase());
        const keyFrequency = keyList.reduce(
            (acc, key) => {
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        const duplicateKeys = Object.entries(keyFrequency)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, count]) => count > 1)
            .map(([key]) => key);

        if (duplicateKeys.length > 0) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        attribute: `Duplicate keys in payload: ${duplicateKeys.join(', ')}`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const attributeList = Object.keys(keyFrequency).map((key) =>
            this.attributesRepository.findOneOrThrow({
                filterQuery: {
                    label: key,
                },
            }),
        );

        const result = await Promise.all(attributeList);
        const resultMap: Record<string, Attribute> = result.reduce(
            (acc: Record<string, Attribute>, attribute: Attribute) => {
                acc[attribute.label] = attribute;
                return acc;
            },
            {},
        );

        return payload
            .map((attributeInProduct) => {
                if (resultMap[attributeInProduct.k]) {
                    return {
                        ...attributeInProduct,
                        _id: resultMap[attributeInProduct.k]._id,
                        u: attributeInProduct.u ?? resultMap[attributeInProduct.k].unit ?? '',
                    };
                }
                return attributeInProduct;
            })
            .sort((a, b) => a.k.localeCompare(b.k));
    }
}
