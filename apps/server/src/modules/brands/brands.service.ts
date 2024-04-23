import { Injectable } from '@nestjs/common';
import { CreateBrandDto, FilterBrandsDto, SortBrandsDto, UpdateBrandDto } from './dtos';
import { BrandsRepository } from './brands.repository';
import { BrandStatusEnum } from './enums';
import { ObjectIdParamDto, TPaginationOptions, convertToObjectId, getSlugFromName } from '~/common';
import { Brand } from './schemas';
import { FilterQuery, Types } from 'mongoose';

@Injectable()
export class BrandsService {
    constructor(protected readonly brandsRepository: BrandsRepository) {}

    async createBrand(data: CreateBrandDto) {
        let uniqSlug = getSlugFromName(data.name, false);
        let suffix = 0;

        while (await this.brandsRepository.isSlugExists(uniqSlug)) {
            uniqSlug = `${getSlugFromName(data.name)}-${suffix++}`;
        }

        const cloneData = {
            ...data,
            status: data.status ?? BrandStatusEnum.Active,
            slug: uniqSlug,
        };
        await this.brandsRepository.create({ document: cloneData });
    }

    async updateBrand(id: ObjectIdParamDto['id'], updateData: UpdateBrandDto) {
        await this.brandsRepository.findOneAndUpdateOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
            updateQuery: updateData,
        });
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
        return this.brandsRepository.findManyWithPagination({
            filterOptions,
            sortOptions,
            paginationOptions,
        });
    }

    async getBrandById(id: ObjectIdParamDto['id'] | Types.ObjectId) {
        return this.brandsRepository.findOneOrThrow({
            filterQuery: { _id: convertToObjectId(id) },
        });
    }

    async findMany({ filterQuery }: { filterQuery: FilterQuery<Brand> }) {
        return this.brandsRepository.find({
            filterQuery: filterQuery,
        });
    }
}
