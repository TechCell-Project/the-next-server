import { PinoLogger } from 'nestjs-pino';
import { SPURepository } from './spus.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSpuDto, QuerySpusDto } from './dtos';
import { BrandsService } from '../brands/brands.service';
import { AttributesService } from '../attributes';
import { SPU } from './schemas';
import { convertToObjectId } from '~/common';

@Injectable()
export class SPUService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly spuRepository: SPURepository,
        private readonly attributesService: AttributesService,
        private readonly brandsService: BrandsService,
    ) {}

    async createSPU(payload: CreateSpuDto) {
        const clonePayload = {
            ...payload,
            commonAttributes: payload?.commonAttributes ?? [],
            models: payload?.models ?? [],
        };

        if (await this.spuRepository.isExistSpuSlug(clonePayload.slug)) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        slug: 'slugAlreadyExist',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const brand = await this.brandsService.getBrandById(clonePayload.brandId);

        if (clonePayload.commonAttributes.length > 0) {
            clonePayload.commonAttributes = await this.attributesService.validateAttributes(
                clonePayload.commonAttributes,
            );
        }

        if (clonePayload.models.length > 0) {
            clonePayload.models = await Promise.all(
                clonePayload.models.map(async (model) => {
                    const duplicateModel = clonePayload.models.find(
                        (m) => m !== model && m.slug === model.slug,
                    );
                    if (duplicateModel) {
                        throw new HttpException(
                            {
                                status: HttpStatus.UNPROCESSABLE_ENTITY,
                                errors: {
                                    slug: `modelSlugAlreadyExist: ${duplicateModel.slug}`,
                                },
                            },
                            HttpStatus.UNPROCESSABLE_ENTITY,
                        );
                    }

                    if ((model?.attributes?.length ?? 0) > 0) {
                        model.attributes = await this.attributesService.validateAttributes(
                            model.attributes,
                        );
                    }

                    if (clonePayload.commonAttributes.length > 0) {
                        const commonAttList = clonePayload.commonAttributes.map(
                            (attribute) => attribute.k,
                        );
                        const modelAttList = model?.attributes?.map((attribute) => attribute.k);
                        const duplicateKeys = modelAttList?.filter((key) =>
                            commonAttList.includes(key),
                        );

                        if (duplicateKeys?.length > 0) {
                            throw new HttpException(
                                {
                                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                                    errors: {
                                        attributes: `modelAttributesAlreadyExist: ${duplicateKeys.join(', ')}`,
                                    },
                                },
                                HttpStatus.UNPROCESSABLE_ENTITY,
                            );
                        }
                    }

                    if (model?.images?.length > 0) {
                        model.images = [];
                    }

                    return model;
                }),
            );
        }

        await this.spuRepository.create({
            document: {
                ...clonePayload,
                brandId: brand._id,
            },
        });
    }

    async getSpus(payload: QuerySpusDto): Promise<SPU[]> {
        return this.spuRepository.findManyWithPagination({
            filterOptions: {
                ...payload?.filters,
            },
            sortOptions: payload?.sort,
            paginationOptions: {
                limit: payload?.limit,
                page: payload?.page,
            },
        });
    }

    async getSpuById(id: string): Promise<SPU> {
        return this.spuRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
    }
}
