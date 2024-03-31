import { ApiProperty } from '@nestjs/swagger';
import { User } from '../schemas';
import { InfinityPaginationResultType } from '~/common/types';

export class UserInfinityPaginationResult implements InfinityPaginationResultType<User> {
    @ApiProperty({
        type: [User],
    })
    readonly data: User[];
    @ApiProperty({ example: true })
    readonly hasNextPage: boolean;

    constructor(data: User[], hasNextPage: boolean) {
        this.data = data;
        this.hasNextPage = hasNextPage;
    }
}
