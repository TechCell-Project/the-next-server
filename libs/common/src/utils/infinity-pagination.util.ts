import { InfinityPaginationResultType } from '../types/infinity-pagination-result.type';
import { TPaginationOptions } from '../types/pagination-options.type';

export const infinityPagination = <T>(
    data: T[],
    options: TPaginationOptions,
): InfinityPaginationResultType<T> => {
    return {
        data,
        hasNextPage: data.length === options.limit,
    };
};
