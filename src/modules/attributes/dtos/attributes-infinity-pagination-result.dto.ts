import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '~/common/types';
import { Attribute } from '../schemas';

export class AttributeInfinityPaginationResult implements InfinityPaginationResultType<Attribute> {
    @ApiProperty({
        type: [Attribute],
    })
    readonly data: Attribute[];
    @ApiProperty({ example: true })
    readonly hasNextPage: boolean;

    constructor(data: Attribute[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
