import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { SkusService } from '../skus';
import { PreviewOrderDto, PreviewOrderResponseDto, ProductInOrderDto } from './dtos';
import { UsersService } from '../users/users.service';
import { GhnService } from '~/third-party';
import { User } from '../users';
import { SKU } from '../skus/schemas';
import { SkuStatusEnum } from '../skus/enums';
import { ItemType } from 'giaohangnhanh/lib/order';
import { ProductsService } from '../products/products.service';
import { PaymentTypeId, RequiredNote } from 'giaohangnhanh/lib/order/enums';
import { ServiceTypeId } from 'giaohangnhanh/lib/enums';
import { PaymentStatusEnum, ShippingProviderEnum } from './enum';

@Injectable()
export class OrdersService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly skusService: SkusService,
        private readonly usersService: UsersService,
        private readonly ghnService: GhnService,
        private readonly productsService: ProductsService,
    ) {}

    async previewOrder(userId: string, payload: PreviewOrderDto) {
        const { addressIndex, products, paymentMethod } = payload;

        const [user, ...skus] = await Promise.all([
            this.usersService.findByIdOrThrow(userId),
            ...products.map((p) => this.skusService.getSkuById(p.skuId)),
        ]);
        const { selectedAddress } = this.validateUserForOrder(user, addressIndex);
        await this.validateSkuForOrder(skus);

        const items = await this.createItemsOfShipping(skus, products);
        const totalHeight = items.reduce(
            (total, item) => total + (item?.height || 1) * item.quantity,
            0,
        );
        const totalLength = items.reduce(
            (total, item) => total + (item?.length || 1) * item.quantity,
            0,
        );
        const totalWidth = items.reduce(
            (total, item) => total + (item?.width || 1) * item.quantity,
            0,
        );
        const totalWeight = items.reduce((total, item) => total + item.weight * item.quantity, 0);

        const previewGhn = await this.ghnService.previewOrder({
            client_order_code: '',
            height: totalHeight,
            length: totalLength,
            weight: totalWeight,
            width: totalWidth,
            items: items,
            payment_type_id: PaymentTypeId.Buyer_Consignee,
            to_address: selectedAddress.detail,
            to_district_id: selectedAddress.districtLevel.districtId,
            to_ward_code: selectedAddress.wardLevel.wardCode,
            to_name: selectedAddress.customerName ?? user.lastName + ' ' + user.firstName,
            to_phone: selectedAddress.phoneNumbers,
            service_type_id: ServiceTypeId.Standard,
            required_note: RequiredNote.ALLOW_VIEW_NOT_TRY,
        });

        const orderPreview = new PreviewOrderResponseDto({
            customer: {
                address: selectedAddress,
                customerId: user._id,
                email: user.email,
            },
            shipping: {
                provider: ShippingProviderEnum.GHN,
                fee: previewGhn.total_fee,
                expectedDeliveryTime: previewGhn.expected_delivery_time,
                logs: [],
            },
            products: skus.map((sku) => ({
                skuId: sku._id,
                unitPrice: sku.price,
                quantity: 1,
                serialNumber: [],
            })),
            payment: {
                method: paymentMethod,
                status: PaymentStatusEnum.Pending,
                url: '',
            },
        });

        return orderPreview;
    }

    private async createItemsOfShipping(
        skus: SKU[],
        productOrders: ProductInOrderDto[],
    ): Promise<ItemType[]> {
        const results: ItemType[] = await Promise.all(
            skus.map(async (sku) => {
                const { weight, height, length, width } =
                    await this.productsService.getProductDimensions(sku._id);
                const { quantity } = productOrders.find(
                    (p) => p.skuId.toString() === sku._id.toString(),
                )!;
                return {
                    name: sku.name,
                    weight: weight,
                    height,
                    length,
                    width,
                    quantity,
                };
            }),
        );
        return results;
    }

    private validateUserForOrder(user: User, addressIndex: number) {
        if ((user?.address?.length ?? 0) <= 0 || !user?.address) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        address: 'userHasNoAddress',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const selectedAddress = user.address[addressIndex];
        if (!selectedAddress) {
            throw new HttpException(
                {
                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                    errors: {
                        address: 'addressIndexNotFound',
                    },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        return { selectedAddress };
    }

    private async validateSkuForOrder(sku: SKU[]) {
        sku.forEach((s) => {
            if (s.status === SkuStatusEnum.Deleted) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            sku: 'productIsNotAvailable',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        });
    }
}
