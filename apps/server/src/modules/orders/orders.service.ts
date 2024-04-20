import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { SkusService } from '../skus';
import {
    PreviewOrderDto,
    PreviewOrderResponseDto,
    ProductInOrderDto,
    VnpayIpnUrlDTO,
} from './dtos';
import { UsersService } from '../users/users.service';
import { GhnService, VnpayService } from '~/third-party';
import { User } from '../users';
import { SKU } from '../skus/schemas';
import { SkuStatusEnum } from '../skus/enums';
import { ItemType } from 'giaohangnhanh/lib/order';
import { ProductsService } from '../products/products.service';
import { PaymentTypeId, RequiredNote } from 'giaohangnhanh/lib/order/enums';
import { ServiceTypeId } from 'giaohangnhanh/lib/enums';
import {
    OrderStatusEnum,
    PaymentMethodEnum,
    PaymentStatusEnum,
    ShippingProviderEnum,
} from './enum';
import {
    InpOrderAlreadyConfirmed,
    IpnFailChecksum,
    IpnInvalidAmount,
    IpnOrderNotFound,
    IpnSuccess,
    IpnUnknownError,
} from 'vnpay';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class OrdersService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly ordersRepository: OrdersRepository,
        private readonly skusService: SkusService,
        private readonly usersService: UsersService,
        private readonly ghnService: GhnService,
        private readonly productsService: ProductsService,
        private readonly vnpayService: VnpayService,
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
        if (!previewGhn) {
            throw new HttpException(
                {
                    errors: {
                        ghn: 'cannotPreviewOrder',
                    },
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

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
                quantity:
                    products.find((p) => p.skuId.toString() === sku._id.toString())?.quantity ?? 1,
                serialNumber: [],
            })),
            payment: {
                method: paymentMethod,
                status: PaymentStatusEnum.Pending,
                url: '',
                paymentData: {},
            },
        });

        return orderPreview;
    }

    async verifyVnpayIpn(query: VnpayIpnUrlDTO) {
        try {
            const isVerified = this.vnpayService.verifyReturnUrl(query);
            if (!isVerified || !isVerified.isSuccess) {
                return IpnFailChecksum;
            }

            const order = await this.ordersRepository.getOrderByIdOrNull(query.vnp_TxnRef);
            if (!order) {
                return IpnOrderNotFound;
            }

            if (order.totalPrice !== Number(query.vnp_Amount) / 100) {
                return IpnInvalidAmount;
            }

            // If payment, or order is completed, or canceled, return error
            if (
                order.orderStatus === OrderStatusEnum.Completed ||
                order.payment.status === PaymentStatusEnum.Completed ||
                order.orderStatus === OrderStatusEnum.Canceled
            ) {
                return InpOrderAlreadyConfirmed;
            }

            order.payment.method = PaymentMethodEnum.VNPAY;
            if (query.vnp_ResponseCode === '00' || query.vnp_TransactionStatus === '00') {
                order.payment.status = PaymentStatusEnum.Completed;
                order.orderStatus = OrderStatusEnum.Pending;
                this.logger.debug('Payment success');
            } else {
                order.payment.status = PaymentStatusEnum.Canceled;
                order.orderStatus = OrderStatusEnum.Canceled;
                this.logger.debug('Payment failed');
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { vnp_SecureHash, ...vnpayQueryData } = query;
            order.payment.paymentData = vnpayQueryData;
            this.logger.debug({ order });
            await this.ordersRepository.findOneAndUpdateOrThrow({
                filterQuery: {
                    _id: order._id,
                },
                updateQuery: order,
            });
            return IpnSuccess;
        } catch (error) {
            this.logger.error(error);
            return IpnUnknownError;
        }
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
