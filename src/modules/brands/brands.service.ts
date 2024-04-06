import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBrandDto, FilterBrandsDto, SortBrandsDto, UpdateBrandDto } from './dtos';
import { BrandsRepository } from './brands.repository';
import { BrandStatus } from './enums';
import { ObjectIdParamDto, TPaginationOptions, convertToObjectId } from '~/common';
import { Brand } from './schemas';

@Injectable()
export class BrandsService {
    constructor(protected readonly brandsRepository: BrandsRepository) {}

    async createBrand(data: CreateBrandDto) {
        const cloneData = { ...data, status: data.status ?? BrandStatus.Active };
        if (await this.brandsRepository.isSlugExists(cloneData.slug)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        slug: 'slugAlreadyExists',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

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

    async findOne(id: ObjectIdParamDto['id']) {
        return this.brandsRepository.findOneOrThrow({
            filterQuery: { _id: convertToObjectId(id) },
        });
    }
}
