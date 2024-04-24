import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { SkusService } from '../skus';
import {
    CreateOrderDto,
    PreviewOrderDto,
    PreviewOrderResponseDto,
    ProductInOrderDto,
    QueryOrdersDto,
    VnpayIpnUrlDTO,
} from './dtos';
import { UsersService } from '../users/users.service';
import { GhnService, ProductCode, VnpayService } from '~/third-party';
import { User } from '../users';
import { SKU } from '../skus/schemas';
import { SkuStatusEnum } from '../skus/enums';
import { ItemType } from 'giaohangnhanh/lib/order';
import { ProductsService } from '../products/products.service';
import { PaymentTypeId, RequiredNote } from 'giaohangnhanh/lib/order/enums';
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
import { ConfigService } from '@nestjs/config';
import { Order } from './schemas';
import { CartsService } from '../carts';
import { RedlockService } from '~/common/redis';
import { ClientSession, Types } from 'mongoose';
import { ExecutionError, Lock } from 'redlock';
import { GhnServiceTypeIdEnum } from '~/third-party/giaohangnhanh/enums';
import { TPaginationOptions } from '~/common';

@Injectable()
export class OrdersService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
        private readonly ordersRepository: OrdersRepository,
        private readonly skusService: SkusService,
        private readonly usersService: UsersService,
        private readonly ghnService: GhnService,
        private readonly productsService: ProductsService,
        private readonly vnpayService: VnpayService,
        private readonly cartsService: CartsService,
        private readonly redlockService: RedlockService,
    ) {}

    async previewOrder(userId: string, payload: PreviewOrderDto): Promise<PreviewOrderResponseDto> {
        const { addressIndex, products, paymentMethod } = payload;

        const [user, ...skus] = await Promise.all([
            this.usersService.findByIdOrThrow(userId),
            ...products.map((p) => this.skusService.getSkuById(p.skuId)),
        ]);
        const { selectedAddress } = this.validateUserForOrder(user, addressIndex);
        await this.validateSkuForOrder(skus);

        const items = await this.createItemsOfShipping(skus, products);
        const { totalHeight, totalLength, totalWeight, totalWidth } = this.calculateTotal(items);

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
            service_type_id: GhnServiceTypeIdEnum.Traditional,
            required_note: RequiredNote.ALLOW_VIEW_NOT_TRY,
        });
        if (!previewGhn) {
            throw new HttpException(
                {
                    errors: {
                        ghn: 'cannotCallGhnApi',
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
            products: skus.map((sku) => ({
                skuId: sku._id,
                productName: sku.name,
                unitPrice: sku.price,
                quantity:
                    products.find((p) => p.skuId.toString() === sku._id.toString())?.quantity ?? 1,
                serialNumber: [],
            })),
            shipping: {
                orderShipCode: '',
                provider: ShippingProviderEnum.GHN,
                fee: previewGhn.total_fee,
                expectedDeliveryTime: previewGhn.expected_delivery_time,
                logs: [],
            },
            payment: {
                method: paymentMethod,
                status: PaymentStatusEnum.Pending,
                url: '',
                paymentData: {},
            },
            orderLogs: [],
        });

        return orderPreview;
    }

    async createOrder({
        userId,
        payload,
        ip,
    }: {
        userId: string;
        payload: CreateOrderDto;
        ip: string;
    }) {
        const resources = [`order_create:user:${userId}`];

        const { addressIndex, products, paymentMethod } = payload;
        const [user, ...skus] = await Promise.all([
            this.usersService.findByIdOrThrow(userId),
            ...products.map((p) => this.skusService.getSkuById(p.skuId)),
        ]);
        const { selectedAddress } = this.validateUserForOrder(user, addressIndex);
        await this.validateSkuForOrder(skus);

        skus.forEach((sku) => resources.push(`order_create:sku:${sku._id}`));

        const items = await this.createItemsOfShipping(skus, products);
        const { totalHeight, totalLength, totalWeight, totalWidth } = this.calculateTotal(items);

        const orderPreview = new PreviewOrderResponseDto({
            customer: {
                address: selectedAddress,
                customerId: user._id,
                email: user.email,
            },
            products: skus.map((sku) => ({
                skuId: sku._id,
                productName: sku.name,
                productType: sku.attributes.map((a) => a.v + (a.u ? a.u : '')).join('-'),
                unitPrice: sku.price,
                quantity:
                    products.find((p) => p.skuId.toString() === sku._id.toString())?.quantity ?? 1,
                serialNumber: [],
                images: sku.image,
            })),
            payment: {
                method: paymentMethod,
                status: PaymentStatusEnum.Pending,
                url: '',
                paymentData: {},
            },
            orderLogs: [],
        });

        const session = await this.ordersRepository.startTransaction();
        let lockOrder: Lock | null = null;

        let order: Order;
        let ghnOrder;
        try {
            lockOrder = await this.redlockService.lock(resources, 5000);
            const orderCreated = await this.ordersRepository.create({
                document: {
                    ...orderPreview,
                    note: payload?.orderNote ?? '',
                    orderStatus: OrderStatusEnum.Pending,
                },
                session,
            });

            const serialsPromise = orderCreated.products.map(async (p) => {
                const serialsNumber = await this.skusService.pickSerialNumberToHold(
                    p.skuId,
                    p.quantity,
                    session,
                );
                return { skuId: p.skuId, serialsNumber };
            });

            const serialsData: { skuId: Types.ObjectId; serialsNumber: string[] }[] =
                await Promise.all(serialsPromise);

            orderCreated.products = orderCreated.products.map((p) => ({
                ...p,
                serialNumber: serialsData.find((s) => s.skuId.toString() === p.skuId.toString())
                    ?.serialsNumber ?? [...p?.serialNumber],
            }));

            const ghnOrderPromise = this.ghnService.createOrder({
                client_order_code: orderCreated._id.toString(),
                height: totalHeight,
                length: totalLength,
                weight: totalWeight,
                width: totalWidth,
                items: items,
                from_address: this.configService.getOrThrow<string>('SHOP_FROM_ADDRESS'),
                from_name: this.configService.getOrThrow<string>('SHOP_FROM_NAME'),
                from_phone: this.configService.getOrThrow<string>('SHOP_FROM_PHONE'),
                from_province_name:
                    this.configService.getOrThrow<string>('SHOP_FROM_PROVINCE_NAME'),
                from_district_name:
                    this.configService.getOrThrow<string>('SHOP_FROM_DISTRICT_NAME'),
                from_ward_name: this.configService.getOrThrow<string>('SHOP_FROM_WARD_NAME'),
                payment_type_id: PaymentTypeId.Buyer_Consignee,
                to_address: selectedAddress.detail,
                to_district_id: selectedAddress.districtLevel.districtId,
                to_ward_code: selectedAddress.wardLevel.wardCode,
                to_name: selectedAddress.customerName ?? user.lastName + ' ' + user.firstName,
                to_phone: selectedAddress.phoneNumbers,
                service_type_id: GhnServiceTypeIdEnum.Traditional,
                required_note: RequiredNote.ALLOW_VIEW_NOT_TRY,
                cod_amount:
                    payload.paymentMethod === PaymentMethodEnum.COD ? orderCreated.totalPrice : 0,
                pick_shift: [0],
                note: payload?.shipNote ?? '',
            });

            const cartUpdatePromise = payload?.isSelectFromCart
                ? this.updateCartAfterOrderCreation(user, orderCreated, session)
                : Promise.resolve();

            [ghnOrder] = await Promise.all([ghnOrderPromise, cartUpdatePromise]);
            if (!ghnOrder) {
                throw new HttpException(
                    {
                        errors: {
                            ghn: 'cannotCallGhnApi',
                        },
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            orderCreated.shipping = {
                ...orderCreated.shipping,
                orderShipCode: ghnOrder.order_code,
                fee: ghnOrder.total_fee,
                expectedDeliveryTime: ghnOrder.expected_delivery_time,
                provider: ShippingProviderEnum.GHN,
                logs: [],
            };
            orderCreated.totalPrice = orderCreated.totalPrice + ghnOrder.total_fee;

            // Payment
            if (payload.paymentMethod !== PaymentMethodEnum.COD) {
                const paymentUrl = this.vnpayService.createPaymentUrl({
                    vnp_Amount: orderCreated.totalPrice,
                    vnp_IpAddr: ip,
                    vnp_OrderInfo: `Thanh toán đơn hàng ${orderCreated._id.toString()}`,
                    vnp_OrderType: ProductCode.MobilePhone_Tablet,
                    vnp_ReturnUrl: payload.paymentReturnUrl,
                    vnp_TxnRef: orderCreated._id.toString(),
                    ...(payload.paymentMethod === PaymentMethodEnum.VNPAY
                        ? {}
                        : { vnp_BankCode: payload.paymentMethod }),
                });

                orderCreated.payment = {
                    ...orderCreated.payment,
                    url: paymentUrl,
                    status: PaymentStatusEnum.WaitForPayment,
                };
            }

            order = await this.ordersRepository.updateOrderById({
                orderId: orderCreated._id,
                updateQuery: new Order(orderCreated),
                session,
            });

            await this.ordersRepository.commitTransaction(session);
        } catch (error) {
            await Promise.all([
                this.ordersRepository.rollbackTransaction(session),
                this.ghnService.cancelOrder(ghnOrder?.order_code),
            ]);
            if (error instanceof ExecutionError) {
                throw new HttpException(
                    {
                        status: HttpStatus.CONFLICT,
                        errors: {
                            order: 'orderInCreating',
                        },
                    },
                    HttpStatus.CONFLICT,
                );
            }
            this.logger.error(error);
            throw error;
        } finally {
            const promises: Promise<unknown>[] = [this.ordersRepository.endSession(session)];

            if (lockOrder) {
                promises.push(this.redlockService.unlock(lockOrder));
            }

            await Promise.all(promises);
        }

        return order;
    }

    async verifyVnpayIpn(query: VnpayIpnUrlDTO) {
        this.logger.debug(`Verify VNPAY IPN: ${JSON.stringify(query)}`);
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
                this.logger.debug('Payment success');
            } else {
                order.payment.status = PaymentStatusEnum.Failed;
                this.logger.debug('Payment failed');
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { vnp_SecureHash, ...vnpayQueryData } = query;
            order.payment.paymentData = vnpayQueryData;
            await this.ordersRepository.updateOrderById({
                orderId: order._id,
                updateQuery: order,
            });
            return IpnSuccess;
        } catch (error) {
            this.logger.error(error);
            return IpnUnknownError;
        }
    }

    async getOrders(
        userId: string,
        {
            filterOptions,
            sortOptions,
            paginationOptions,
        }: {
            filterOptions?: QueryOrdersDto['filters'] | null;
            sortOptions?: QueryOrdersDto['sort'] | null;
            paginationOptions: TPaginationOptions;
        },
    ) {
        return this.ordersRepository.findManyWithPagination({
            filterOptions,
            customerId: userId,
            sortOptions,
            paginationOptions,
        });
    }

    async getOrderById({ userId, orderId }: { userId: string; orderId: string }) {
        return this.ordersRepository.getOrderById(userId, orderId);
    }

    private async updateCartAfterOrderCreation(
        user: User,
        orderCreated: Order,
        session: ClientSession,
    ) {
        const cartFound = await this.cartsService.getCarts(user._id);
        const productToDel: string[] = orderCreated.products.map((p) => p.skuId.toString());
        cartFound.products = cartFound.products.filter(
            (p) => !productToDel.includes(p.skuId.toString()),
        );
        await this.cartsService.updateCart(
            {
                userId: user._id,
                data: cartFound,
            },
            session,
        );
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

    private calculateTotal(items: ItemType[]) {
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

        return { totalHeight, totalLength, totalWidth, totalWeight };
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
