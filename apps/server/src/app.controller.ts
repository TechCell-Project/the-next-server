import { Controller, Get, Query } from '@nestjs/common';
import { convertTimeString } from 'convert-time-string';
import { RedisService } from '~/common/redis';

@Controller({
    path: '/rd',
})
export class AppController {
    constructor(private readonly redisService: RedisService) {}

    @Get('/enable-cache')
    async enable() {
        return this.redisService.set('IS_USE_CACHE', true);
    }

    @Get('/disable-cache')
    async disable(@Query() { time }: { time: string }) {
        return this.redisService.set('IS_USE_CACHE', false, convertTimeString(time));
    }
}
