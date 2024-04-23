import { ApiProperty } from '@nestjs/swagger';
import { SerialNumber } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class SkuInfinityPaginationResult implements InfinityPaginationResultType<SerialNumber> {
    @ApiProperty({
        type: [SerialNumber],
    })
    readonly data: SerialNumber[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: SerialNumber[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
