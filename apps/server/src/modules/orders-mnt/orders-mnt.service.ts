import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueryOrdersMntDto } from './dtos';
import { PinoLogger } from 'nestjs-pino';
import { convertToObjectId, TPaginationOptions } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { UserRoleEnum } from '../users/enums';
import { FilterQuery } from 'mongoose';
import { Order, OrderStatusEnum, PaymentStatusEnum, SelectOrderTypeEnum } from '~/server/orders';
import { OrdersRepository } from '../orders/orders.repository';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { SkusService } from '../skus';
import { SerialNumberStatusEnum } from '../skus/enums';
import { GhnService } from '~/third-party/giaohangnhanh';

@Injectable()
export class OrdersMntService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly ordersMntRepository: OrdersRepository,
        private readonly skusService: SkusService,
        private readonly ghnService: GhnService,
    ) {}

    async updateOrderStatus(
        user: JwtPayloadType,
        orderId: string,
        { orderStatus: updateStatus, note, updateSerialNumbers = [] }: UpdateOrderStatusDto,
    ) {
        const promises = [];
        const order = await this.getOrdersMntById(user, orderId);
        order.orderLogs = order.orderLogs || [];

        switch (updateStatus) {
            case OrderStatusEnum.Confirmed: {
                if (user.role !== UserRoleEnum.Sales) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only sales can confirm order',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus !== OrderStatusEnum.Pending) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'orderStatus is not pending',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                order.orderStatus = OrderStatusEnum.Confirmed;
                order.orderLogs = order.orderLogs || [];
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Confirmed}`,
                    note,
                });
                break;
            }
            case OrderStatusEnum.Preparing: {
                if (user.role !== UserRoleEnum.Accountant) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only accountant can change order to preparing',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus !== OrderStatusEnum.Confirmed) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'orderStatus is not confirmed',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                order.orderStatus = OrderStatusEnum.Preparing;
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Preparing}`,
                    note,
                });
                break;
            }
            case OrderStatusEnum.Prepared: {
                // Prepared order, make all serial number available
                // Only warehouse can change order to prepared
                if (user.role !== UserRoleEnum.Warehouse) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only warehouse can change order to prepared',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus !== OrderStatusEnum.Preparing) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'orderStatus is not preparing',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                promises.push(this.soldSerialNumber(order, updateSerialNumbers));
                order.orderStatus = OrderStatusEnum.Prepared;
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Prepared}`,
                    note,
                });
                break;
            }
            case OrderStatusEnum.Shipping: {
                // Only warehouse can change order to prepared
                // Hand over product to delivery service
                if (user.role !== UserRoleEnum.Warehouse) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only warehouse can change order to prepared',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus !== OrderStatusEnum.Prepared) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'orderStatus is not prepared',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                order.orderStatus = OrderStatusEnum.Shipping;
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Shipping}`,
                    note,
                });
                break;
            }
            case OrderStatusEnum.Completed: {
                // Completed order, make all serial number sold
                // Only accountant can change order to completed
                if (user.role !== UserRoleEnum.Accountant) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only accountant can complete order',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus !== OrderStatusEnum.Shipping) {
                    throw new HttpException(
                        {
                            errors: {
                                order: `orderStatus is not ${OrderStatusEnum.Shipping}`,
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                order.orderStatus = OrderStatusEnum.Completed;
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Completed}`,

                    note,
                });
                break;
            }
            case OrderStatusEnum.Failed: {
                // Failed order, make all serial number available
                // Only if payment is completed
                // Only if order is not shipping
                // Only accountant can change order to failed
                if (user.role !== UserRoleEnum.Accountant) {
                    throw new HttpException(
                        {
                            errors: {
                                user: 'Only accountant can change order to failed',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.payment.status === PaymentStatusEnum.Completed) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'can not failed order when payment is completed',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (
                    order.orderStatus === OrderStatusEnum.Canceled ||
                    order.orderStatus === OrderStatusEnum.Failed ||
                    order.orderStatus === OrderStatusEnum.Completed
                ) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'can not failed order when order already done',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                if (order.orderStatus === OrderStatusEnum.Shipping) {
                    throw new HttpException(
                        {
                            errors: {
                                order: 'can not failed order when order is shipping',
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }

                order.payment.status = PaymentStatusEnum.Failed;
                order.payment.url = '';

                order.orderStatus = OrderStatusEnum.Failed;
                order.orderLogs.push({
                    actorId: convertToObjectId(user.userId),
                    action: `Update status to ${OrderStatusEnum.Failed}`,
                    note,
                });

                order.products.forEach((product) => {
                    product.serialNumber.forEach((serialNumber) => {
                        promises.push(
                            this.skusService.updateSerialNumber(serialNumber, {
                                status: SerialNumberStatusEnum.Available,
                            }),
                        );
                    });
                });

                if (order.shipping?.orderShipCode && order.shipping.orderShipCode !== '') {
                    promises.push(this.ghnService.cancelOrder(order.shipping.orderShipCode));
                }
                break;
            }
            default:
                throw new BadRequestException('Invalid order status');
        }

        await Promise.all([
            this.ordersMntRepository.updateOrderById({
                orderId: convertToObjectId(orderId),
                updateQuery: order,
            }),
            ...promises,
        ]);
    }

    async getOrdersMntById(user: JwtPayloadType, orderId: string) {
        const filters: FilterQuery<Order> = {
            _id: convertToObjectId(orderId),
        };
        filters.$or = filters.$or || [];
        filters.$or.push({
            orderLogs: {
                $elemMatch: {
                    actorId: convertToObjectId(user.userId),
                },
            },
        });

        switch (user.role) {
            case UserRoleEnum.Sales:
                filters.$or.push({
                    orderStatus: OrderStatusEnum.Pending,
                });
                break;
            case UserRoleEnum.Warehouse:
                filters.$or.push(
                    {
                        orderStatus: OrderStatusEnum.Preparing,
                    },
                    {
                        orderStatus: OrderStatusEnum.Prepared,
                    },
                );
                break;
            case UserRoleEnum.Accountant:
                delete filters.$or;
                break;
            default:
                throw new HttpException('Forbidden orders-mnt access', HttpStatus.FORBIDDEN);
        }

        this.logger.debug({ filters }, 'getOrdersMntById');
        const order = await this.ordersMntRepository.findOneOrThrow({
            filterQuery: filters,
        });

        return new Order(order);
    }

    async getOrdersMnt(
        user: JwtPayloadType,
        query: {
            filterOptions?: QueryOrdersMntDto['filters'] | null;
            sortOptions?: QueryOrdersMntDto['sort'] | null;
            paginationOptions: TPaginationOptions;
        },
    ) {
        switch (user.role) {
            case UserRoleEnum.Sales:
                return this.getOrdersSalesMnt(user, query);
            case UserRoleEnum.Accountant:
                return this.getOrdersAccountantMnt(user, query);
            case UserRoleEnum.Warehouse:
                return this.getOrdersWarehouseMnt(user, query);
            default:
                throw new HttpException('Forbidden access', HttpStatus.FORBIDDEN);
        }
    }

    private async getOrdersSalesMnt(
        user: JwtPayloadType,
        {
            filterOptions,
            sortOptions,
            paginationOptions,
        }: {
            filterOptions?: QueryOrdersMntDto['filters'] | null;
            sortOptions?: QueryOrdersMntDto['sort'] | null;
            paginationOptions: TPaginationOptions;
        },
    ) {
        const where: FilterQuery<Order> = {};
        switch (filterOptions?.selectType) {
            case SelectOrderTypeEnum.onlyJoined:
                where.orderLogs = {
                    $elemMatch: {
                        actorId: convertToObjectId(user.userId),
                    },
                };
                break;
            case SelectOrderTypeEnum.onlyNeed:
                where.orderStatus = OrderStatusEnum.Pending;
                break;
            case SelectOrderTypeEnum.both:
            default:
                where.$or = where.$or || [];
                where.$or.push(
                    {
                        orderLogs: {
                            $elemMatch: {
                                actorId: convertToObjectId(user.userId),
                            },
                        },
                    },
                    {
                        orderStatus: OrderStatusEnum.Pending,
                    },
                );
                break;
        }

        return this.ordersMntRepository.findManyWithPaginationMnt({
            filterQuery: where,
            sortOptions,
            paginationOptions,
        });
    }

    private async getOrdersAccountantMnt(
        user: JwtPayloadType,
        {
            filterOptions,
            sortOptions,
            paginationOptions,
        }: {
            filterOptions?: QueryOrdersMntDto['filters'] | null;
            sortOptions?: QueryOrdersMntDto['sort'] | null;
            paginationOptions: TPaginationOptions;
        },
    ) {
        const where: FilterQuery<Order> = {};
        switch (filterOptions?.selectType) {
            case SelectOrderTypeEnum.onlyJoined:
                where.orderLogs = {
                    $elemMatch: {
                        actorId: convertToObjectId(user.userId),
                    },
                };
                break;
            case SelectOrderTypeEnum.onlyNeed:
                where.orderStatus = {
                    $in: [OrderStatusEnum.Confirmed, OrderStatusEnum.Prepared],
                };
                break;
            case SelectOrderTypeEnum.allForAccountant:
                break;
            case SelectOrderTypeEnum.both:
            default:
                where.$or = where.$or || [];
                where.$or.push(
                    {
                        orderLogs: {
                            $elemMatch: {
                                actorId: convertToObjectId(user.userId),
                            },
                        },
                    },
                    {
                        orderStatus: {
                            $in: [OrderStatusEnum.Confirmed, OrderStatusEnum.Prepared],
                        },
                    },
                );
                break;
        }

        this.logger.debug({ where }, 'getOrdersAccountantMnt');
        return this.ordersMntRepository.findManyWithPaginationMnt({
            filterQuery: where,
            sortOptions,
            paginationOptions,
        });
    }

    private async getOrdersWarehouseMnt(
        user: JwtPayloadType,
        {
            filterOptions,
            sortOptions,
            paginationOptions,
        }: {
            filterOptions?: QueryOrdersMntDto['filters'] | null;
            sortOptions?: QueryOrdersMntDto['sort'] | null;
            paginationOptions: TPaginationOptions;
        },
    ) {
        const where: FilterQuery<Order> = {};
        switch (filterOptions?.selectType) {
            case SelectOrderTypeEnum.onlyJoined:
                where.orderLogs = {
                    $elemMatch: {
                        actorId: convertToObjectId(user.userId),
                    },
                };
                break;
            case SelectOrderTypeEnum.onlyNeed:
                where.orderStatus = {
                    $in: [OrderStatusEnum.Preparing],
                };
                break;
            case SelectOrderTypeEnum.both:
            default:
                where.$or = where.$or || [];
                where.$or.push(
                    {
                        orderLogs: {
                            $elemMatch: {
                                actorId: convertToObjectId(user.userId),
                            },
                        },
                    },
                    {
                        orderStatus: {
                            $in: [OrderStatusEnum.Preparing],
                        },
                    },
                );
                break;
        }

        return this.ordersMntRepository.findManyWithPaginationMnt({
            filterQuery: where,
            sortOptions,
            paginationOptions,
        });
    }

    private async soldSerialNumber(
        order: Order,
        updateSerialNumbers: UpdateOrderStatusDto['updateSerialNumbers'],
    ) {
        const updatedMap = new Map<string, string[]>();
        if (updateSerialNumbers && updateSerialNumbers?.length > 0) {
            for (const serialNumber of updateSerialNumbers) {
                updatedMap.set(serialNumber.skuId, Array.from(new Set(serialNumber.serialNumbers)));
            }
        }

        const productPromises = order.products.map(async (product) => {
            if (updatedMap.size > 0 && updatedMap.has(product.skuId.toString())) {
                const updated = updatedMap.get(product.skuId.toString());
                if (!updated) {
                    return;
                }
                if (updated.length !== product.serialNumber.length) {
                    throw new HttpException(
                        {
                            errors: {
                                serialNumbers: `quantity of serial number not match: ${product.skuId}`,
                            },
                        },
                        HttpStatus.UNPROCESSABLE_ENTITY,
                    );
                }
                await this.skusService.changeSerialNumberToOther(
                    product.skuId,
                    product.serialNumber,
                    updated,
                );
            } else {
                await this.skusService.confirmSerialNumber(product.serialNumber);
            }
        });

        await Promise.all(productPromises);
    }
}
