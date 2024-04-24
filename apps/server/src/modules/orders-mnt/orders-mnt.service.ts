import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueryOrdersMntDto } from './dtos';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { RedlockService } from '~/common/redis';
import { convertToObjectId, TPaginationOptions } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { UserRoleEnum } from '../users/enums';
import { FilterQuery } from 'mongoose';
import { OrdersMntRepository } from './orders-mnt.repository';
import { Order, OrderStatusEnum, SelectOrderTypeEnum } from '~/server/orders';

@Injectable()
export class OrdersMntService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly configService: ConfigService,
        private readonly ordersMntRepository: OrdersMntRepository,
        private readonly redlockService: RedlockService,
    ) {}

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
                filters.$or.push({
                    orderStatus: OrderStatusEnum.Preparing,
                });
                break;
            case UserRoleEnum.Accountant:
                filters.$or = [];
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
                where.$or.push([
                    {
                        orderLogs: {
                            $elemMatch: {
                                actorId: convertToObjectId(user.userId),
                            },
                        },
                    },
                ]);
                break;
        }

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
                where.$or.push([
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
                ]);
                break;
        }

        return this.ordersMntRepository.findManyWithPaginationMnt({
            filterQuery: where,
            sortOptions,
            paginationOptions,
        });
    }
}
