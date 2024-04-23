import { Test, TestingModule } from '@nestjs/testing';
import { OrdersMntController } from '../orders-mnt.controller';
import { OrdersMntService } from '../orders-mnt.service';
import { QueryOrdersMntDto } from '../dtos';
import { Types } from 'mongoose';
import { JwtPayloadType } from '~/server/auth/strategies/types';
import { UserRoleEnum } from '~/server/users/enums';

describe('OrdersMntController', () => {
    let controller: OrdersMntController;
    let service: OrdersMntService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersMntController],
            providers: [
                {
                    provide: OrdersMntService,
                    useValue: {
                        getOrdersMnt: jest.fn().mockResolvedValue({ data: [], total: 0 }),
                    },
                },
            ],
        }).compile();

        controller = module.get<OrdersMntController>(OrdersMntController);
        service = module.get<OrdersMntService>(OrdersMntService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should handle role access correctly', async () => {
        const user: JwtPayloadType = {
            userId: new Types.ObjectId().toString(),
            role: UserRoleEnum.Sales,
        } as unknown as JwtPayloadType;
        const query: QueryOrdersMntDto = { page: 1, limit: 10 };
        await controller.getOrdersMnt(user, query);
        expect(service.getOrdersMnt).toHaveBeenCalledWith(user, {
            filterOptions: undefined,
            sortOptions: undefined,
            paginationOptions: { page: 1, limit: 10 },
        });
    });

    it('should cap limit at 100', async () => {
        const user: JwtPayloadType = {
            userId: new Types.ObjectId().toString(),
            role: UserRoleEnum.Sales,
        } as unknown as JwtPayloadType;
        const query: QueryOrdersMntDto = { page: 1, limit: 150 };
        await controller.getOrdersMnt(user, query);
        expect(service.getOrdersMnt).toHaveBeenCalledWith(user, {
            filterOptions: undefined,
            sortOptions: undefined,
            paginationOptions: { page: 1, limit: 100 },
        });
    });

    it('should use default pagination when not provided', async () => {
        const user: JwtPayloadType = {
            userId: new Types.ObjectId().toString(),
            role: UserRoleEnum.Sales,
        } as unknown as JwtPayloadType;
        const query = {};
        await controller.getOrdersMnt(user, query as unknown as QueryOrdersMntDto);
        expect(service.getOrdersMnt).toHaveBeenCalledWith(user, {
            filterOptions: undefined,
            sortOptions: undefined,
            paginationOptions: { page: 1, limit: 10 },
        });
    });
});
