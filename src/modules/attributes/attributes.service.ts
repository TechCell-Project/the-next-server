import { Injectable } from '@nestjs/common';
import { AttributesRepository } from './attributes.repository';
import { CreateAttributeDto, GetAttributesDto } from './dtos';
import { Attribute } from './schemas';
import { convertToObjectId } from '~/common';

@Injectable()
export class AttributesService {
    constructor(private readonly attributesRepository: AttributesRepository) {}

    async createAttribute(payload: CreateAttributeDto): Promise<void> {
        await this.attributesRepository.createAttribute(payload);
    }

    async getAttributes(payload: GetAttributesDto): Promise<Attribute[]> {
        return this.attributesRepository.findManyWithPagination({
            filterOptions: payload?.filters,
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
}
