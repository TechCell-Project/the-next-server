import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '~/common/types';
import { Tag } from '../schemas';

export class TagInfinityPaginationResult implements InfinityPaginationResultType<Tag> {
    @ApiProperty({
        type: [Tag],
    })
    readonly data: Tag[];
    @ApiProperty({ example: true, type: Boolean })
    readonly hasNextPage: boolean;

    constructor(data: Tag[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
