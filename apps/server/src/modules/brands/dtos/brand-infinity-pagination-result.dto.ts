import { ApiProperty } from '@nestjs/swagger';
import { Brand } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class BrandInfinityPaginationResult implements InfinityPaginationResultType<Brand> {
    @ApiProperty({
        type: [Brand],
    })
    readonly data: Brand[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: Brand[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
