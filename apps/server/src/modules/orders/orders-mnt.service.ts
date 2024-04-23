import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { SkusService } from '../skus';
import { QueryOrdersMntDto } from './dtos';
import { UsersService } from '../users/users.service';
import { GhnService, VnpayService } from '~/third-party';
import { ProductsService } from '../products/products.service';
import { OrderStatusEnum } from './enum';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Order } from './schemas';
import { CartsService } from '../carts';
import { RedlockService } from '~/common/redis';
import { convertToObjectId, TPaginationOptions } from '~/common';
import { JwtPayloadType } from '../auth/strategies/types';
import { UserRoleEnum } from '../users/enums';
import { SelectOrderTypeEnum } from './enum/query-type.enum';
import { FilterQuery } from 'mongoose';

@Injectable()
export class OrdersMntService {
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

        return this.ordersRepository.findManyWithPaginationMnt({
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
                where.orderStatus = {};
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

        return this.ordersRepository.findManyWithPaginationMnt({
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

        return this.ordersRepository.findManyWithPaginationMnt({
            filterQuery: where,
            sortOptions,
            paginationOptions,
        });
    }
}
