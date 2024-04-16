import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CartsRepository } from './carts.repository';
import { ClientSession, FilterQuery, QueryOptions, Types } from 'mongoose';
import { UpdateCartDto } from './dtos';
import { IGetCartByProduct } from './interfaces';
import { Cart } from './schemas';
import { convertToObjectId } from '~/common/utils';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartsService {
    constructor(
        private readonly cartRepository: CartsRepository,
        private readonly productsService: ProductsService,
    ) {}

    /**
     * @description Update cart if user already has cart (upsert)
     * @param param0 userId and array of all product in cart
     * @returns updated cart
     */
    async updateCart(
        { userId, data }: { userId: string; data: UpdateCartDto },
        session?: ClientSession,
    ) {
        let cartFound = await this.cartRepository.findOne({
            filterQuery: { userId: convertToObjectId(userId) },
        });

        if (!cartFound) {
            cartFound = await this.cartRepository.create({
                document: {
                    userId: convertToObjectId(userId),
                    products: [],
                },
            });
        }

        await this.validateProductInCart({ products: data.products });

        // Update the quantity of existing products or add new products
        data.products.forEach((newProduct) => {
            const existingProduct = cartFound?.products.find(
                (product) =>
                    product.productId === newProduct.productId &&
                    product.skuId === newProduct.skuId,
            );

            if (existingProduct) {
                if (newProduct.quantity === 0) {
                    existingProduct.quantity = 0;
                } else {
                    existingProduct.quantity += newProduct.quantity;
                }
            } else {
                cartFound?.products.push(newProduct);
            }
        });

        // Remove products with quantity less than or equal to 0
        cartFound.products = cartFound?.products.filter((product) => product.quantity > 0);

        return this.cartRepository.updateCartLockSession(
            {
                userId: convertToObjectId(userId),
                products: cartFound?.products,
            },
            session,
        );
    }

    async getCarts(userId: Types.ObjectId | string) {
        return this.cartRepository.find({ filterQuery: { userId: convertToObjectId(userId) } });
    }

    async getCartByProduct({ userId, productId, sku }: IGetCartByProduct) {
        return this.cartRepository.findOne({
            filterQuery: {
                userId,
                products: { $elemMatch: { productId, sku } },
            },
        });
    }

    async countCartUser(userId: Types.ObjectId) {
        return this.cartRepository.count({ userId: convertToObjectId(userId) });
    }

    async getCartByUserId({
        userId,
        filterQueries,
        options,
    }: {
        userId: Types.ObjectId;
        filterQueries?: FilterQuery<Cart>;
        options?: QueryOptions<Cart>;
    }) {
        return this.cartRepository.findOne({
            filterQuery: { userId, ...filterQueries },
            queryOptions: options,
        });
    }

    async getCartByUserIdOrFail({
        userId,
        filterQueries,
        options,
    }: {
        userId: Types.ObjectId;
        filterQueries?: FilterQuery<Cart>;
        options?: QueryOptions<Cart>;
    }): Promise<Cart | null> {
        try {
            const res = await this.cartRepository.findOne({
                filterQuery: { userId, ...filterQueries },
                queryOptions: options,
            });
            return res;
        } catch (error) {
            return Promise.resolve(null);
        }
    }

    async validateProductInCart({ products }: UpdateCartDto) {
        const errors: unknown[] = [];

        await Promise.all(
            products.map(async (product) => {
                const res = await this.productsService.getProductByIdWithSku(
                    product.productId,
                    product.skuId,
                );
                if (!res) {
                    errors.push({
                        productId: `Product not found: ${product.productId} - sku: ${product.skuId}`,
                    });
                }
            }),
        );

        if (errors.length > 0) {
            throw new HttpException(
                {
                    errors: errors,
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
    }
}
