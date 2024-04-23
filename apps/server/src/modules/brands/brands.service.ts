import { Injectable } from '@nestjs/common';
import { CreateBrandDto, FilterBrandsDto, SortBrandsDto, UpdateBrandDto } from './dtos';
import { BrandsRepository } from './brands.repository';
import { BrandStatusEnum } from './enums';
import {
    AbstractService,
    ObjectIdParamDto,
    TPaginationOptions,
    convertToObjectId,
    getSlugFromName,
} from '~/common';
import { Brand } from './schemas';
import { FilterQuery, Types } from 'mongoose';
import { RedisService } from '~/common/redis';
import { convertTimeString } from 'convert-time-string';

@Injectable()
export class BrandsService extends AbstractService {
    constructor(
        protected readonly brandsRepository: BrandsRepository,
        private readonly redisService: RedisService,
    ) {
        super('CACHE_SPU');
    }

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
        await Promise.all([
            this.brandsRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: convertToObjectId(id),
                },
                updateQuery: updateData,
            }),
            this.redisService.del(this.buildCacheKey(this.updateBrand.name, id)),
        ]);
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
        const cacheKey = this.buildCacheKey(this.findManyWithPagination.name, {
            filterOptions,
            sortOptions,
            paginationOptions,
        });
        const fromCache = await this.redisService.get<Brand[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.brandsRepository.findManyWithPagination({
            filterOptions,
            sortOptions,
            paginationOptions,
        });

        await this.redisService.set(cacheKey, res, convertTimeString('3m'));
        return res;
    }

    async getBrandById(id: ObjectIdParamDto['id'] | Types.ObjectId) {
        const cacheKey = this.buildCacheKey(this.getBrandById.name, id);
        const fromCache = await this.redisService.get<Brand>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.brandsRepository.findOneOrThrow({
            filterQuery: { _id: convertToObjectId(id) },
        });
        await this.redisService.set(cacheKey, res, convertTimeString('3m'));
        return res;
    }

    async findMany({ filterQuery }: { filterQuery: FilterQuery<Brand> }) {
        const cacheKey = this.buildCacheKey(this.findMany.name, { filterQuery });
        const fromCache = await this.redisService.get<Brand[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.brandsRepository.find({
            filterQuery: filterQuery,
        });
        if (!res) {
            return res;
        }

        await this.redisService.set(cacheKey, res, convertTimeString('3m'));
        return res;
    }
}
