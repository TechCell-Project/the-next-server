import { PinoLogger } from 'nestjs-pino';
import { SPURepository } from './spus.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSpuDto, QuerySpusDto } from './dtos';
import { BrandsService } from '../brands/brands.service';
import { AttributesService } from '../attributes';
import { ImageSchema, SPU, SPUModelSchema } from './schemas';
import { convertToObjectId } from '~/common';
import { ImagesService } from '../images';

@Injectable()
export class SPUService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly spuRepository: SPURepository,
        private readonly attributesService: AttributesService,
        private readonly brandsService: BrandsService,
        private readonly imagesService: ImagesService,
    ) {}

    async createSPU(payload: CreateSpuDto) {
        const clonePayload: Partial<SPU> = {
            slug: payload.slug,
        };

        if (await this.spuRepository.isExistSpuSlug(clonePayload?.slug ?? payload.slug)) {
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
                        slug: model.slug,
                        name: model.name,
                        description: model.description,
                    };

                    const duplicateModel = payload.models.find(
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

        await this.spuRepository.create({
            document: clonePayload as SPU,
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
