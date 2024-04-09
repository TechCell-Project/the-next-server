import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SkusRepository } from './skus.repository';
import { CreateSkuDto, QuerySkusDto } from './dtos';
import { SKU } from './schemas';
import { SPUService } from '../spus';
import { ImagesService } from '../images';
import { AttributesService } from '../attributes';
import { SkuStatusEnum } from './skus.enum';
import { convertToObjectId } from '~/common';
import { Types } from 'mongoose';

@Injectable()
export class SkusService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly skusRepository: SkusRepository,
        private readonly spusService: SPUService,
        private readonly imagesService: ImagesService,
        private readonly attributesService: AttributesService,
    ) {
        this.logger.setContext(SkusService.name);
    }

    async createSku(data: CreateSkuDto) {
        const cloneData: Partial<SKU> = {
            name: data.name,
            description: data.description,
            status: data?.status ?? SkuStatusEnum.Newly,
        };

        const spuFound = await this.spusService.getSpuById(data.spuId);
        const spuModelFound = spuFound.models.find((model) => model.slug === data.spuModelSlug);
        if (!spuModelFound) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        spuModel: 'spuModelNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        cloneData.spuId = spuFound._id;
        cloneData.spuModelSlug = spuModelFound.slug;

        if (data?.imagePublicId) {
            const imageFound = await this.imagesService.getImageByPublicId(data.imagePublicId);
            if (!imageFound) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            image: 'imageNotFound',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            cloneData.image = {
                publicId: imageFound.publicId,
                url: imageFound.url,
            };
        }

        cloneData.attributes = await this.attributesService.validateAttributes(data.attributes);
        await this.skusRepository.create({
            document: {
                name: data.name,
                description: data.description,
                spuId: spuFound._id,
                spuModelSlug: spuModelFound.slug,
                status: data?.status ?? SkuStatusEnum.Newly,
                attributes: cloneData.attributes,
                categories: data.categories ?? [],
                price: data.price,
                serialNumbers: [] as string[],
                ...(cloneData.image && { image: cloneData.image }),
            },
        });
    }

    async getSkus(query: QuerySkusDto) {
        return this.skusRepository.findManyWithPagination({
            filterOptions: {
                ...query?.filters,
            },
            sortOptions: query?.sort,
            paginationOptions: {
                limit: query?.limit,
                page: query?.page,
            },
        });
    }

    async getSkuById(id: string | Types.ObjectId) {
        return this.skusRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
    }
}
