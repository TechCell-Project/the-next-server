import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TagsService } from '../tags/tags.service';
import { BrandsService } from '../brands/brands.service';
import { SkusService } from '../skus';
import { SpusService } from '../spus';
import { ProductDto, ProductInListDto, QueryProductsDto } from './dtos';
import { RedisService } from '~/common/redis';
import { SKU } from '../skus/schemas';
import { FilterQuery, Types } from 'mongoose';
import { convertToObjectId, sortedStringify } from '~/common/utils';
import { convertTimeString } from 'convert-time-string';
import { ConfigService } from '@nestjs/config';
import { QuerySpusDto } from '../spus/dtos';

@Injectable()
export class ProductsService {
    private static readonly SPLITTER = '|';
    public DIMENSIONS_KEY: string;
    public WEIGHT_KEY: string;

    public static toProductId(spuId: Types.ObjectId, modelSlug: string): string {
        return `${modelSlug}${ProductsService.SPLITTER}${spuId.toString()}`;
    }

    public static fromProductId(productId: string): {
        spuId: string;
        modelSlug: string;
    } {
        try {
            const [modelSlug, spuId] = productId.split(ProductsService.SPLITTER);
            if (!spuId || !modelSlug) {
                throw new HttpException(
                    {
                        message: 'Invalid productId format',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
            return { spuId, modelSlug };
        } catch (error) {
            throw new HttpException(
                {
                    message: 'Invalid productId format',
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger,
        private readonly redisService: RedisService,
        private readonly tagsService: TagsService,
        private readonly brandsService: BrandsService,
        private readonly spusService: SpusService,
        private readonly skusService: SkusService,
    ) {
        this.logger.setContext(ProductsService.name);
        this.DIMENSIONS_KEY = this.configService.getOrThrow<string>('DIMENSIONS_ATTRIBUTE_KEY');
        this.WEIGHT_KEY = this.configService.getOrThrow<string>('WEIGHT_ATTRIBUTE_KEY');
    }

    async getProductById(productId: string) {
        const { spuId, modelSlug } = ProductsService.fromProductId(productId);
        const spu = await this.spusService.getSpuById(spuId);
        if (spu.models.every((m) => m.slug !== modelSlug)) {
            throw new HttpException(
                {
                    errors: {
                        modelSlug: {
                            message: 'Model not found: ' + modelSlug,
                        },
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const skus = await this.skusService.getSkusBySpuIdOrThrow({
            spuId: spu._id,
            spuModelSlug: modelSlug,
        });
        return new ProductDto(spu, modelSlug, skus);
    }

    async getProductByIdWithSku(productId: string, skuId: string | Types.ObjectId) {
        const { spuId, modelSlug } = ProductsService.fromProductId(productId);
        const spu = await this.spusService.getSpuById(spuId);
        if (spu.models.every((m) => m.slug !== modelSlug)) {
            throw new HttpException(
                {
                    errors: {
                        modelSlug: {
                            message: 'Model not found: ' + modelSlug,
                        },
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const skus = await this.skusService.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(skuId),
            },
        });

        return new ProductDto(spu, modelSlug, [skus]);
    }

    async getProducts({ filters, ...payload }: QueryProductsDto) {
        const { limit, page } = payload;
        const start = (page - 1) * limit;

        const cacheKey = `CACHE_products_${sortedStringify({ filters })}`;
        const fromCache = await this.redisService.get<ProductInListDto[]>(cacheKey);
        if (fromCache) {
            return fromCache.slice(start, start + limit);
        }

        const { keyword } = filters || {};
        const spuFilters: QuerySpusDto['filters'] = {};
        const skuFilters: FilterQuery<SKU> = {};

        if (keyword) {
            const brandsWithKeyword = await this.brandsService.findManyWithPagination({
                filterOptions: {
                    keyword: keyword,
                },
                paginationOptions: {
                    limit: 0,
                    page,
                },
            });

            spuFilters.keyword = keyword;
            spuFilters.brandIds = Array.from(
                new Set([
                    ...(filters?.brandIds ?? []),
                    ...(brandsWithKeyword ?? []).map((b) => b._id.toString()),
                ]),
            );
        }

        if (filters?.brandIds) {
            spuFilters.brandIds = Array.from(
                new Set([
                    ...(spuFilters?.brandIds?.map((b) => b.toString()) || []),
                    ...filters.brandIds,
                ]),
            );
        }

        const spus = await this.spusService.getSpus({
            limit: 0,
            page,
            filters: spuFilters,
        });

        if (filters?.tagIds) {
            skuFilters.tags = {
                $in: filters.tagIds.map((t) => convertToObjectId(t)),
            };
            skuFilters.spuId = {
                $in: spus.map((s) => s._id),
            };
        }

        const skus = await this.skusService.getSkusOrThrow({
            filterQuery: skuFilters,
        });

        const resultProducts = await Promise.all(skus.map((s) => this.getProductInListFromSku(s)));
        await this.redisService.set(cacheKey, resultProducts, convertTimeString('5m'));
        return resultProducts.slice(start, start + limit);
    }

    async getProductDimensions(skuId: string | Types.ObjectId, isCeil = true) {
        const sku = await this.skusService.getSkuById(skuId);
        const product = await this.getProductByIdWithSku(
            ProductsService.toProductId(sku.spuId, sku.spuModelSlug),
            skuId,
        );

        const attributeList = [...product.attributes, ...product.variations[0].attributes];
        const weightString = attributeList.find((a) => a.k === this.WEIGHT_KEY)?.v;
        const dimensionsString = attributeList.find((a) => a.k === this.DIMENSIONS_KEY)?.v;
        if (!dimensionsString) {
            throw new HttpException(
                {
                    errors: {
                        dimensions: 'dimensionsNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        const [length, width, height] = dimensionsString.split('x').map((d) => {
            const valueInMm = parseFloat(d.replace(',', '.'));
            const valueInCm = valueInMm / 10;

            if (isCeil) {
                return Math.ceil(valueInCm);
            }
            return valueInCm;
        });

        if (!weightString) {
            throw new HttpException(
                {
                    errors: {
                        weight: 'weightNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        const weight = isCeil
            ? Math.ceil(parseFloat(weightString.replace(',', '.')))
            : parseFloat(weightString.replace(',', '.'));

        return {
            length,
            width,
            height,
            weight,
        };
    }

    async getProductInListFromSku(sku: SKU): Promise<ProductInListDto> {
        const [spu, ...tag] = await Promise.all([
            this.spusService.getSpuById(sku.spuId),
            ...(sku.tags?.map((tagId) => this.tagsService.getTagById(tagId.toString())) || []),
        ]);
        const brand = await this.brandsService.getBrandById(spu.brandId);
        const model = spu.models.find((m) => m.slug === sku.spuModelSlug)!;

        const product = new ProductInListDto({
            brandName: brand.name,
            id: ProductsService.toProductId(spu._id, model.slug),
            images: [],
            modelName: model.name,
            name: spu.name,
            price: sku.price,
            tags: tag,
        });
        return product;
    }

    async getProductFromSku(sku: SKU) {
        const spu = await this.spusService.getSpuById(sku.spuId);
        const modelSlug = spu.models.find((m) => m.slug === sku.spuModelSlug)!.slug;
        const product = new ProductDto(spu, modelSlug, [sku]);
        return product;
    }
}
