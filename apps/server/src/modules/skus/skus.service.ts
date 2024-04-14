import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SkusRepository } from './skus.repository';
import { CreateSkuDto, QuerySkusDto, UpdateSkuDto } from './dtos';
import { SKU } from './schemas';
import { SpusService } from '../spus';
import { ImagesService } from '../images';
import { AttributesService } from '../attributes';
import { SerialNumberStatusEnum, SkuStatusEnum } from './enums';
import { convertToObjectId, sanitizeHtmlString } from '~/common';
import { Types } from 'mongoose';
import { SerialNumberRepository } from './serial-number.repository';

@Injectable()
export class SkusService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly skusRepository: SkusRepository,
        private readonly serialNumberRepository: SerialNumberRepository,
        private readonly spusService: SpusService,
        private readonly imagesService: ImagesService,
        private readonly attributesService: AttributesService,
    ) {
        this.logger.setContext(SkusService.name);
    }

    async createSku(data: CreateSkuDto) {
        const cloneData: Partial<SKU> = {
            name: data.name,
            description: sanitizeHtmlString(data.description),
            status: data?.status ?? SkuStatusEnum.Newly,
        };

        const { spuFound, spuModelFound, validatedAttributes } = await this.validateSku(data);

        cloneData.spuId = spuFound._id;
        cloneData.spuModelSlug = spuModelFound.slug;
        cloneData.attributes = validatedAttributes;

        if (data?.imagePublicId) {
            const imageFound = await this.imagesService.getImageByPublicId(data.imagePublicId);
            cloneData.image = {
                publicId: imageFound.publicId,
                url: imageFound.url,
            };
        }

        await this.skusRepository.create({
            document: {
                name: cloneData.name!,
                description: cloneData.description!,
                status: cloneData?.status ?? SkuStatusEnum.Newly,
                spuId: spuFound._id,
                spuModelSlug: spuModelFound.slug,
                attributes: cloneData.attributes,
                tags: cloneData.tags ?? [],
                price: cloneData?.price ?? data.price,
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

    async addSerialNumbers(skuId: string | Types.ObjectId, serialNumbers: string[]) {
        const sku = await this.skusRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(skuId),
            },
        });
        const serialNumbersFound = await this.serialNumberRepository.find({
            filterQuery: {
                skuId: sku._id,
                number: {
                    $in: serialNumbers,
                },
            },
        });

        const listSoldNumber =
            serialNumbersFound
                ?.filter(
                    (serialNumber) =>
                        serialNumber.number && serialNumber.status === SerialNumberStatusEnum.Sold,
                )
                .map((serialNumber) => serialNumber.number) ?? [];
        const listAvailableNumber =
            serialNumbersFound
                ?.filter(
                    (serialNumber) =>
                        serialNumber.number &&
                        serialNumber.status === SerialNumberStatusEnum.Available,
                )
                .map((serialNumber) => serialNumber.number) ?? [];

        const listToAdd = serialNumbers.filter(
            (serialNumber) =>
                !listSoldNumber.includes(serialNumber) &&
                !listAvailableNumber.includes(serialNumber),
        );

        if (listToAdd?.length <= 0) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        serialNumbers: 'noSerialNumberToAdd',
                        ...(listSoldNumber?.length > 0 && { existSold: listSoldNumber }),
                        ...(listAvailableNumber?.length > 0 && {
                            existAvailable: listAvailableNumber,
                        }),
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        await this.serialNumberRepository.addMany(sku._id, listToAdd);

        if (listSoldNumber?.length > 0 || listAvailableNumber?.length > 0) {
            return {
                errors: {
                    ...(listSoldNumber?.length > 0 && { existSold: listSoldNumber }),
                    ...(listAvailableNumber?.length > 0 && {
                        existAvailable: listAvailableNumber,
                    }),
                },
            };
        }
    }

    async updateSkuById(id: string | Types.ObjectId, data: UpdateSkuDto) {
        let skuFound = await this.skusRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        if (data.imagePublicId) {
            const imageFound = await this.imagesService.getImageByPublicId(data.imagePublicId);
            skuFound.image = {
                publicId: imageFound.publicId,
                url: imageFound.url,
            };
            delete data.imagePublicId;
        }

        if (data?.description) {
            skuFound.description = sanitizeHtmlString(data.description);
            delete data.description;
        }

        if (data?.tags) {
            skuFound.tags = [];
            delete data.tags;
        }

        skuFound = { ...skuFound, ...data };
        await this.skusRepository.findOneAndUpdateOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
            updateQuery: {
                $set: skuFound,
            },
        });
    }

    private async validateSku(data: CreateSkuDto) {
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

        const skuFound = await this.skusRepository.findOne({
            filterQuery: {
                spuId: spuFound._id,
                spuModelSlug: spuModelFound.slug,
            },
        });

        const validatedAttributes = await this.attributesService.validateAttributes(
            data.attributes,
        );

        if (skuFound) {
            const foundAttributes = skuFound.attributes
                .map((attribute) => ({
                    key: attribute.k.toString().toLowerCase(),
                    value: attribute.v.toString().toLowerCase(),
                }))
                .sort((a, b) => a.key.localeCompare(b.key));
            const comingAttributes = validatedAttributes
                .map((attribute) => ({
                    key: attribute.k.toString().toLowerCase(),
                    value: attribute.v.toString().toLowerCase(),
                }))
                .sort((a, b) => a.key.localeCompare(b.key));

            const areArraysEqual =
                JSON.stringify(foundAttributes) === JSON.stringify(comingAttributes);
            if (areArraysEqual === true) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: { skus: 'skuAlreadyExists' },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        }

        return {
            spuFound,
            spuModelFound,
            validatedAttributes,
        };
    }
}
