import { PinoLogger } from 'nestjs-pino';
import { SPURepository } from './spus.repository';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
    AddSpuModelDto,
    CreateSpuDto,
    QuerySpusDto,
    UpdateSPUModelSchemaDto,
    UpdateSpuDto,
} from './dtos';
import { BrandsService } from '../brands/brands.service';
import { AttributesService } from '../attributes';
import { ImageSchema, SPU, SPUModelSchema } from './schemas';
import { AbstractService, convertToObjectId, getSlugFromName, sanitizeHtmlString } from '~/common';
import { ImagesService } from '../images';
import { Types } from 'mongoose';
import { RedisService } from '~/common/redis';
import { convertTimeString } from 'convert-time-string';

@Injectable()
export class SpusService extends AbstractService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly spuRepository: SPURepository,
        private readonly attributesService: AttributesService,
        private readonly brandsService: BrandsService,
        private readonly imagesService: ImagesService,
        private readonly redisService: RedisService,
    ) {
        super('CACHE_SPU');
    }

    async createSPU(payload: CreateSpuDto) {
        const clonePayload: Partial<SPU> = {
            name: payload.name,
        };
        let uniqSlug = getSlugFromName(payload.name, false);
        let suffix = 0;

        while (await this.spuRepository.isExistSpuSlug(uniqSlug)) {
            uniqSlug = `${getSlugFromName(payload.name)}-${suffix++}`;
        }
        clonePayload.slug = uniqSlug;

        const brand = await this.brandsService.getBrandById(payload.brandId);
        clonePayload.brandId = brand._id;

        if ((payload?.commonAttributes?.length ?? 0) > 0) {
            clonePayload.commonAttributes = await this.attributesService.validateAttributes(
                payload.commonAttributes,
            );
        }

        if ((payload?.models?.length ?? 0) > 0) {
            clonePayload.models = await Promise.all(
                payload.models.map(async (model) => {
                    const cloneModel: Partial<SPUModelSchema> = {
                        slug: getSlugFromName(model.slug, false),
                        name: model.name,
                        description: model.description,
                    };

                    const duplicateModel = payload.models.find(
                        (m) => m !== model && m.slug === cloneModel.slug,
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
                        cloneModel.attributes = await this.attributesService.validateAttributes(
                            model.attributes,
                        );
                    }

                    if ((clonePayload?.commonAttributes?.length ?? 0) > 0) {
                        const commonAttKeyList = clonePayload.commonAttributes!.map(
                            (attribute) => attribute.k,
                        );
                        const duplicateKeys = model?.attributes
                            ?.map((attribute) => attribute.k)
                            ?.filter((key) => commonAttKeyList.includes(key));

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
                        const thumbnailCount = model.images.filter(
                            (image) => image.isThumbnail,
                        ).length;
                        if (thumbnailCount === 0) {
                            model.images[0].isThumbnail = true;
                        } else if (thumbnailCount > 1) {
                            throw new HttpException(
                                {
                                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                                    errors: {
                                        images: 'onlyOneThumbnail',
                                    },
                                },
                                HttpStatus.UNPROCESSABLE_ENTITY,
                            );
                        }

                        const imagesPromise = model.images.map((image) =>
                            this.imagesService.getImageByPublicId(image.publicId),
                        );
                        const imagesData = await Promise.all(imagesPromise);

                        cloneModel.images = imagesData.map<ImageSchema>((image, index) => ({
                            publicId: image.publicId,
                            url: image.url,
                            isThumbnail: model.images[index].isThumbnail,
                        }));
                    }

                    return cloneModel as SPUModelSchema;
                }),
            );
        }

        return await this.spuRepository.create({
            document: clonePayload as SPU,
        });
    }

    async getSpus(payload: QuerySpusDto): Promise<SPU[]> {
        const cacheKey = this.buildCacheKey(this.getSpus.name, payload);
        const fromCache = await this.redisService.get<SPU[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.spuRepository.findManyWithPagination({
            filterOptions: {
                ...payload?.filters,
            },
            sortOptions: payload?.sort,
            paginationOptions: {
                limit: payload?.limit,
                page: payload?.page,
            },
        });

        await this.redisService.set(cacheKey, res, convertTimeString('10s'));
        return res;
    }

    async getSpuById(id: string | Types.ObjectId): Promise<SPU> {
        const cacheKey = this.buildCacheKey(this.getSpuById.name, id);
        const fromCache = await this.redisService.get<SPU>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.spuRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        await this.redisService.set(cacheKey, res, convertTimeString('5s'));
        return res;
    }

    async updateSpu(id: string | Types.ObjectId, payload: UpdateSpuDto) {
        const cloneUpdateData: Partial<UpdateSpuDto> = {};

        const oldSpu = await this.spuRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        if (payload?.name) {
            if (oldSpu.name !== payload.name) {
                cloneUpdateData.name = payload.name;
            }
        }

        if (payload?.description) {
            const descriptionSanitize = sanitizeHtmlString(payload.description);
            if (oldSpu.description !== descriptionSanitize) {
                cloneUpdateData.description = descriptionSanitize;
            }
        }

        if (payload?.commonAttributes) {
            cloneUpdateData.commonAttributes = await this.attributesService.validateAttributes(
                payload.commonAttributes,
            );
        }

        if (Object.keys(cloneUpdateData).length === 0) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        spu: 'nothingToUpdate',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        await Promise.all([
            this.spuRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: convertToObjectId(id),
                },
                updateQuery: cloneUpdateData,
            }),
            this.redisService.del(this.buildCacheKey(this.getSpuById.name, id)),
        ]);
    }

    async addSpuModels(id: string | Types.ObjectId, { models: addedModels }: AddSpuModelDto) {
        const spu = await this.spuRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        const newModels = [...spu.models, ...addedModels];
        const validatedModels = await this.validateModels(spu.commonAttributes, newModels);

        await this.spuRepository.findOneAndUpdateOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
            updateQuery: {
                models: validatedModels,
            },
        });
    }

    async updateSpuModel(
        id: string | Types.ObjectId,
        slug: string,
        updatedModels: UpdateSPUModelSchemaDto,
    ) {
        const spu = await this.spuRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        const modelIndex = spu.models.findIndex((m) => m.slug === slug);
        if (modelIndex === -1) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        model: 'modelNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        Object.assign(spu.models[modelIndex], updatedModels);

        const validatedModels = await this.validateModels(spu.commonAttributes, spu.models);

        await Promise.all([
            this.spuRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: convertToObjectId(id),
                },
                updateQuery: {
                    models: validatedModels,
                },
            }),
            this.redisService.del(this.buildCacheKey(this.getSpuById.name, id)),
        ]);
    }

    public async isImageInUse(publicId: string): Promise<boolean> {
        if (!publicId) {
            throw new BadRequestException('publicId is required');
        }
        return (
            (await this.spuRepository.count({
                'models.images': {
                    $elemMatch: {
                        publicId,
                    },
                },
            })) > 0
        );
    }

    private async validateModels(
        commonAttributes: CreateSpuDto['commonAttributes'],
        models: CreateSpuDto['models'],
    ): Promise<SPUModelSchema[]> {
        return await Promise.all(
            models.map(async (model) => {
                const cloneModel: Partial<SPUModelSchema> = {
                    slug: getSlugFromName(model.slug, false),
                    name: model.name,
                    description: model.description,
                };

                const duplicateModel = models.find(
                    (m) => m !== model && m.slug === cloneModel.slug,
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
                    cloneModel.attributes = await this.attributesService.validateAttributes(
                        model.attributes,
                    );
                }

                if ((commonAttributes?.length ?? 0) > 0) {
                    const commonAttKeyList = commonAttributes.map((attribute) => attribute.k);
                    const duplicateKeys = model?.attributes
                        ?.map((attribute) => attribute.k)
                        ?.filter((key) => commonAttKeyList.includes(key));

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
                    const thumbnailCount = model.images.filter((image) => image.isThumbnail).length;
                    if (thumbnailCount === 0) {
                        model.images[0].isThumbnail = true;
                    } else if (thumbnailCount > 1) {
                        throw new HttpException(
                            {
                                status: HttpStatus.UNPROCESSABLE_ENTITY,
                                errors: {
                                    images: 'onlyOneThumbnail',
                                },
                            },
                            HttpStatus.UNPROCESSABLE_ENTITY,
                        );
                    }

                    const imagesPromise = model.images.map((image) =>
                        this.imagesService.getImageByPublicId(image.publicId),
                    );
                    const imagesData = await Promise.all(imagesPromise);

                    cloneModel.images = imagesData.map<ImageSchema>((image, index) => ({
                        publicId: image.publicId,
                        url: image.url,
                        isThumbnail: model.images[index].isThumbnail,
                    }));
                }

                return cloneModel as SPUModelSchema;
            }),
        );
    }
}
