import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class OrderInfinityPaginationResult implements InfinityPaginationResultType<Order> {
    @ApiProperty({
        type: [Order],
    })
    readonly data: Order[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: Order[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
