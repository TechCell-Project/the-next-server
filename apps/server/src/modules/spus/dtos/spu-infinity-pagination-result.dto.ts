import { ApiProperty } from '@nestjs/swagger';
import { SPU } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class SpuInfinityPaginationResult implements InfinityPaginationResultType<SPU> {
    @ApiProperty({
        type: [SPU],
    })
    readonly data: SPU[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: SPU[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
