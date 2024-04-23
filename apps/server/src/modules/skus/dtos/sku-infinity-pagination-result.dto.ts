import { ApiProperty } from '@nestjs/swagger';
import { SKU } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class SkuInfinityPaginationResult implements InfinityPaginationResultType<SKU> {
    @ApiProperty({
        type: [SKU],
    })
    readonly data: SKU[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: SKU[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
