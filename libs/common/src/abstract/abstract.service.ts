import { sortedStringify } from '../utils';

export class AbstractService {
    constructor(cachePrefix: string) {
        this.CACHE_PREFIX = cachePrefix;
    }

    public CACHE_PREFIX: string = 'CACHE_BASE';

    public buildCacheKey(fnName: string, ...args: any[]) {
        return `${this.CACHE_PREFIX}_${fnName}:${sortedStringify(args)}`;
    }
}
