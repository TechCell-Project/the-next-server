import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SkusRepository } from './skus.repository';
import { CreateSkuDto, QuerySerialNumberDto, QuerySkusDto, UpdateSkuDto } from './dtos';
import { SerialNumber, SKU } from './schemas';
import { SpusService } from '../spus';
import { ImagesService } from '../images';
import { AttributesService } from '../attributes';
import { SerialNumberStatusEnum, SkuStatusEnum } from './enums';
import { AbstractService, convertToObjectId, sanitizeHtmlString } from '~/common';
import { ClientSession, FilterQuery, Types, UpdateQuery } from 'mongoose';
import { SerialNumberRepository } from './serial-number.repository';
import { remove as removeDiacritics } from 'diacritics';
import { RedisService, RedlockService } from '~/common/redis';
import { ExecutionError, Lock } from 'redlock';
import { convertTimeString } from 'convert-time-string';

@Injectable()
export class SkusService extends AbstractService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly skusRepository: SkusRepository,
        private readonly serialNumberRepository: SerialNumberRepository,
        private readonly spusService: SpusService,
        private readonly imagesService: ImagesService,
        private readonly attributesService: AttributesService,
        private readonly redlockService: RedlockService,
        private readonly redisService: RedisService,
    ) {
        super('CACHE_SKU');
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
                isThumbnail: false,
            };
        }

        return await this.skusRepository.create({
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
        const cacheKey = this.buildCacheKey(this.getSkus.name, query);
        const fromCache = await this.redisService.get<SKU[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        let skus = await this.skusRepository.findManyWithPagination({
            filterOptions: {
                ...query?.filters,
            },
            sortOptions: query?.sort,
            paginationOptions: {
                limit: query?.limit,
                page: query?.page,
            },
        });
        skus = skus.map((sku) => new SKU(sku));

        await this.redisService.set(cacheKey, skus, convertTimeString('10s'));
        return skus;
    }

    async getSkusOrThrow(data: { filterQuery: FilterQuery<SKU> }) {
        const cacheKey = this.buildCacheKey(this.getSkusOrThrow.name, data);
        const fromCache = await this.redisService.get<SKU[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const skus = await this.skusRepository.findOrThrow({ filterQuery: data.filterQuery });

        await this.redisService.set(cacheKey, skus, convertTimeString('10s'));
        return skus;
    }

    async getSkuById(id: string | Types.ObjectId) {
        const cacheKey = this.buildCacheKey(this.getSkuById.name, id);
        const fromCache = await this.redisService.get<SKU>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const sku = await this.skusRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });

        await this.redisService.set(cacheKey, sku, convertTimeString('10s'));
        return sku;
    }

    async getSkusBySpuIdOrThrow(data: { spuId: string | Types.ObjectId; spuModelSlug: string }) {
        const result = await this.skusRepository.findOrThrow({
            filterQuery: {
                spuId: convertToObjectId(data.spuId),
                spuModelSlug: data.spuModelSlug,
            },
        });

        if (!result) {
            throw new HttpException(
                {
                    errors: {
                        sku: 'SKU not found',
                    },
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return result;
    }

    async findOneOrThrow(data: { filterQuery: FilterQuery<SKU> }) {
        const cacheKey = this.buildCacheKey(this.findOneOrThrow.name, data);
        const fromCache = await this.redisService.get<SKU>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const res = await this.skusRepository.findOneOrThrow(data);

        await this.redisService.set(cacheKey, res, convertTimeString('5s'));
        return res;
    }

    async addSerialNumbers(skuId: string | Types.ObjectId, serialNumbers: string[]) {
        const sku = await this.skusRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(skuId),
            },
        });
        const serialNumbersFound = await this.serialNumberRepository.find({
            filterQuery: {
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
                isThumbnail: false,
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
        await Promise.all([
            this.skusRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: convertToObjectId(id),
                },
                updateQuery: {
                    $set: skuFound,
                },
            }),
            this.redisService.del(this.buildCacheKey(this.getSkuById.name, id)),
        ]);
    }

    async countSerialNumberWithSkuId(skuId: string | Types.ObjectId) {
        return this.serialNumberRepository.count({
            filterQuery: {
                skuId: convertToObjectId(skuId),
                status: SerialNumberStatusEnum.Available,
            },
        });
    }

    async pickSerialNumberToHold(
        skuId: string | Types.ObjectId,
        quantity: number,
        session: ClientSession,
    ) {
        let resources: string[] = [];
        let serialNumbers = await this.serialNumberRepository.find({
            filterQuery: {
                skuId: convertToObjectId(skuId),
                status: SerialNumberStatusEnum.Available,
            },
            queryOptions: {
                limit: quantity,
            },
        });

        if (!serialNumbers || serialNumbers?.length < quantity) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        sku: 'notEnoughQuantity',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        let lock: Lock;

        try {
            serialNumbers.forEach((serialNumber) => {
                resources.push(`serialNumber:${serialNumber.number}`);
            });

            lock = await this.redlockService.lock(resources, 3000);
        } catch (err) {
            if (err instanceof HttpException) {
                throw err;
            }

            // If lock failed, find other serial numbers excluding the locked ones
            serialNumbers = await this.serialNumberRepository.find({
                filterQuery: {
                    skuId: convertToObjectId(skuId),
                    status: SerialNumberStatusEnum.Available,
                    number: { $nin: serialNumbers.map((sn) => sn.number) }, // Exclude locked serial numbers
                },
                queryOptions: {
                    limit: quantity,
                },
            });
            if (!serialNumbers || serialNumbers?.length < quantity) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            sku: 'notEnoughQuantity',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }

            // Try to lock again
            resources = [];
            serialNumbers.forEach((serialNumber) => {
                resources.push(`serialNumber:${serialNumber.number}`);
            });

            lock = await this.redlockService.lock(resources, 3000);
        }

        const updatePromises = serialNumbers.map((serialNumber) =>
            this.serialNumberRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: serialNumber._id,
                },
                updateQuery: {
                    status: SerialNumberStatusEnum.Holding,
                },
                session,
            }),
        );

        // const queuePromises = serialNumbers.map((serialNumber) =>
        //     this.releaseHoldSkuQueue.add(
        //         RELEASE_HOLD_SERIAL_NUMBER_QUEUE,
        //         {
        //             serialNumber: serialNumber.number,
        //         },
        //         {
        //             jobId: `${serialNumber.number}`,
        //             delay: convertTimeString(isPreview ? '5m' : '15m'),
        //         },
        //     ),
        // );

        const serials = (await Promise.all(updatePromises)).map(
            (serialNumber) => serialNumber.number,
        );

        await this.redlockService.unlock(lock);
        return serials;
    }

    async changeSerialNumberToOther(
        skuId: string | Types.ObjectId,
        currentSNs: string[],
        updateSNs: string[],
    ) {
        const current = await this.getSerialNumbers({
            skuId: convertToObjectId(skuId),
            number: { $in: currentSNs },
            status: SerialNumberStatusEnum.Holding,
        });
        const update = await this.getSerialNumbers({
            skuId: convertToObjectId(skuId),
            number: { $in: updateSNs },
            status: SerialNumberStatusEnum.Available,
        });

        if (current.length !== currentSNs.length || update.length !== updateSNs.length) {
            throw new HttpException(
                {
                    errors: {
                        serialNumbers: `quantity of serial number not match: ${skuId}`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        await Promise.all([
            current.map((sn) =>
                this.updateSerialNumber(sn.number, {
                    status: SerialNumberStatusEnum.Available,
                }),
            ),
            update.map((sn) =>
                this.updateSerialNumber(sn.number, { status: SerialNumberStatusEnum.Sold }),
            ),
        ]);
    }

    async confirmSerialNumber(serialNumber: string[]) {
        await Promise.all(
            serialNumber.map((sn) =>
                this.updateSerialNumber(sn, {
                    status: SerialNumberStatusEnum.Sold,
                }),
            ),
        );
    }

    async updateSerialNumber(serialNumber: string, update: UpdateQuery<SerialNumber>) {
        const lockKey = `serialNumber:${serialNumber}`;
        let lock: Lock | null = null;
        try {
            lock = await this.redlockService.lock([lockKey], 3000);
            await this.serialNumberRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    number: serialNumber,
                },
                updateQuery: update,
            });
        } catch (error) {
            if (error instanceof ExecutionError) {
                throw new HttpException(
                    {
                        errors: {
                            serialNumber: 'serialNumberIsUpdating: ' + serialNumber,
                        },
                    },
                    HttpStatus.CONFLICT,
                );
            }
        } finally {
            if (lock) {
                await this.redlockService.unlock(lock);
            }
        }
    }

    async getSerialNumber(filter: FilterQuery<SerialNumber>) {
        return this.serialNumberRepository.findOneOrThrow({
            filterQuery: {
                status: SerialNumberStatusEnum.Available,
                ...filter,
            },
        });
    }

    async getSerialNumbers(filter: FilterQuery<SerialNumber>) {
        return this.serialNumberRepository.findOrThrow({
            filterQuery: {
                status: SerialNumberStatusEnum.Available,
                ...filter,
            },
        });
    }

    async getSerialNumbersWithPagination(query: QuerySerialNumberDto) {
        return this.serialNumberRepository.findManyWithPagination({
            filterOptions: query?.filters,
            sortOptions: query?.sort,
            paginationOptions: {
                limit: query?.limit,
                page: query?.page,
            },
        });
    }

    async releaseHoldSerialNumber(serialNumber: string) {
        await this.serialNumberRepository.findOneAndUpdate({
            filterQuery: {
                number: serialNumber,
                status: SerialNumberStatusEnum.Holding,
            },
            updateQuery: {
                $set: {
                    status: SerialNumberStatusEnum.Available,
                },
            },
        });
    }

    public async isImageInUse(publicId: string): Promise<boolean> {
        if (!publicId) {
            throw new BadRequestException('publicId is required');
        }
        return (await this.skusRepository.count({ 'image.publicId': publicId })) > 0;
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

        const skuFound = await this.skusRepository.find({
            filterQuery: {
                spuId: spuFound._id,
                spuModelSlug: spuModelFound.slug,
            },
        });

        const validatedAttributes = await this.attributesService.validateAttributes(
            data.attributes,
        );

        const commonAttributesKeys = new Set(
            spuFound.commonAttributes.map((attribute) => attribute.k),
        );
        const validatedAttributesKeys = new Set(
            validatedAttributes.map((attribute) => attribute.k),
        );

        const duplicateKeys = [];
        for (const key of commonAttributesKeys) {
            if (validatedAttributesKeys.has(key)) {
                duplicateKeys.push(key);
            }
        }

        if (duplicateKeys.length > 0) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        attributes: `The following keys already exist: ${duplicateKeys.join(', ')}`,
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        if (skuFound) {
            skuFound.forEach((sku) => {
                const foundAttributes = sku.attributes
                    .map((attribute) => ({
                        key: attribute.k.toString().toLowerCase(),
                        value: removeDiacritics(attribute.v.toString().toLowerCase()),
                    }))
                    .sort((a, b) => a.key.localeCompare(b.key));

                const comingAttributes = validatedAttributes
                    .map((attribute) => ({
                        key: attribute.k.toString().toLowerCase(),
                        value: removeDiacritics(attribute.v.toString().toLowerCase()),
                    }))
                    .sort((a, b) => a.key.localeCompare(b.key));

                const areArraysEqual =
                    JSON.stringify(foundAttributes) === JSON.stringify(comingAttributes);

                if (areArraysEqual) {
                    throw new HttpException(
                        {
                            status: HttpStatus.UNPROCESSABLE_ENTITY,
                            errors: { skus: 'skuAlreadyExists' },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
            });
        }

        return {
            spuFound,
            spuModelFound,
            validatedAttributes,
        };
    }
}
