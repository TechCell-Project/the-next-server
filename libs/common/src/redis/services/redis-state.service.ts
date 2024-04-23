// import { REDIS_CLIENT, REDIS_STORE } from '~libs/common/constants';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisStateService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisStateService.name);
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    async onModuleInit() {
        await this.checkRedisConnection();
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    private async checkRedisConnection() {
        try {
            await this.redisClient.ping();
            this.logger.debug(`[${'REDIS_CLIENT'}] Redis client connected`);
        } catch (error) {
            this.logger.error(`[${'REDIS_CLIENT'}] Unable to connect to Redis`, error);
        }
    }
}
