import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TagsService } from '../tags/tags.service';
import { BrandsService } from '../brands/brands.service';
import { SkusService } from '../skus';
import { SpusService } from '../spus';
import { ProductDto, ProductInListDto, QueryProductsDto } from './dtos';
import { RedisService } from '~/common/redis';
import { SPU } from '../spus/schemas';
import { Brand } from '../brands';
import { SKU } from '../skus/schemas';
import { Types } from 'mongoose';
import { convertToObjectId, sortedStringify } from '~/common/utils';
import { convertTimeString } from 'convert-time-string';

@Injectable()
export class ProductsService {
    private static readonly SPLITTER = '|';

    public static toProductId(spu: SPU, modelSlug: string): string {
        return `${spu._id.toString()}${ProductsService.SPLITTER}${modelSlug}`;
    }

    public static fromProductId(productId: string): {
        spuId: string;
        modelSlug: string;
    } {
        try {
            const [spuId, modelSlug] = productId.split(ProductsService.SPLITTER);
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
        private readonly logger: PinoLogger,
        private readonly redisService: RedisService,
        private readonly tagsService: TagsService,
        private readonly brandsService: BrandsService,
        private readonly spusService: SpusService,
        private readonly skusService: SkusService,
    ) {
        this.logger.setContext(ProductsService.name);
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
        const cacheKey = `CACHE_products_${sortedStringify({ filters, ...payload })}`;
        const fromCache = await this.redisService.get<ProductInListDto[]>(cacheKey);
        if (fromCache) {
            return fromCache;
        }

        const { limit, page } = payload;
        const { keyword } = filters || {};
        let spuFilters: QueryProductsDto['filters'] = {};

        if (keyword) {
            const brandsWithKeyword = await this.brandsService.findManyWithPagination({
                filterOptions: {
                    keyword: keyword,
                },
                paginationOptions: {
                    limit,
                    page,
                },
            });

            spuFilters = {
                ...spuFilters,
                keyword: keyword,
                brandIds: Array.from(
                    new Set([
                        ...(filters?.brandIds ?? []),
                        ...(brandsWithKeyword ?? []).map((b) => b._id.toString()),
                    ]),
                ),
            };
        }

        const spus = await this.spusService.getSpus({
            limit,
            page,
            filters: spuFilters,
        });
        const products = await this.assignPopulateToSpu(spus);
        const resultProducts = this.mapToListProducts(products);

        await this.redisService.set(cacheKey, resultProducts, convertTimeString('3m'));
        return resultProducts;
    }

    private async assignPopulateToSpu(spu: SPU[]) {
        let products = [];
        products = await this.assignBrandToSpu(spu);
        products = await this.assignSkusToSpu(products);

        return products as ({ skus: SKU[]; brand: Brand } & SPU)[];
    }

    private async assignBrandToSpu(
        spus: SPU[],
        brands: Brand[] = [],
    ): Promise<({ brand: Brand } & SPU)[]> {
        const brandIds = Array.from(new Set(spus?.map((b) => b.brandId.toString())));
        const brandsMap: Map<string, Brand> = new Map();

        // Populate brandsMap with the provided brands
        brands?.forEach((b) => {
            brandsMap.set(b._id.toString(), b);
        });

        // Get the brandIds that are not already in brandsMap
        const missingBrandIds = brandIds.filter((b) => !brandsMap.has(b));

        // Fetch the missing brands
        const getMissingBrands = await Promise.all(
            missingBrandIds.map((b) => this.brandsService.getBrandById(b)),
        );

        getMissingBrands.forEach((b) => {
            brandsMap.set(b._id.toString(), b);
        });

        return spus.map((s: SPU & { brand: Brand }) => {
            const brand = brandsMap.get(s.brandId.toString()) || ({} as Brand);
            return { ...s, brand };
        });
    }

    private async assignSkusToSpu(
        spus: ({ brand: Brand } & SPU)[],
    ): Promise<({ skus: SKU[]; brand: Brand } & SPU)[]> {
        const spuIds: { spuId: string; spuModelSlug: string }[] =
            spus?.flatMap((b) =>
                b.models.map((m) => ({
                    spuId: b._id.toString(),
                    spuModelSlug: m.slug,
                })),
            ) || [];
        const skus = await Promise.all(spuIds.map((s) => this.skusService.getSkusBySpuId(s)));

        return spus.map((s) => {
            Object.assign(s, {
                skus: skus.filter((sku) => sku?.spuId.toString() === s._id.toString()),
            });
            return s as { skus: SKU[]; brand: Brand } & SPU;
        });
    }

    private mapToListProducts(
        listSpu: ({ skus: SKU[]; brand: Brand } & SPU)[],
    ): ProductInListDto[] {
        const products: ProductInListDto[] = [];

        for (const spu of listSpu) {
            for (const model of spu.models) {
                const sku = spu.skus.find((sku) => sku?.spuModelSlug === model.slug);
                const prod = {
                    id: ProductsService.toProductId(spu, model.slug),
                    name: spu.name,
                    modelName: model.name,
                    brandName: spu.brand.name,
                    images: model.images ?? [],
                    price: sku?.price ? sku.price : spu.skus[0].price,
                    tags: sku?.tags ? sku.tags.map((tag) => tag.toString()) : [],
                };
                if (sku?.image) {
                    prod.images.push({ ...sku.image, isThumbnail: false });
                }
                products.push(prod);
            }
        }

        return products;
    }
}
