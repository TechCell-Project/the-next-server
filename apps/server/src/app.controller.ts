import { Controller, Get, Query } from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
import { convertTimeString } from 'convert-time-string';
import { RedisService } from '~/common/redis';

@ApiExcludeController()
@Controller({
    path: '/rd',
})
export class AppController {
    constructor(private readonly redisService: RedisService) {}

    @ApiExcludeEndpoint()
    @Get('/enable-cache')
    async enable() {
        return this.redisService.set('IS_USE_CACHE', true);
    }

    @ApiExcludeEndpoint()
    @Get('/disable-cache')
    async disable(@Query() { time }: { time: string }) {
        return this.redisService.set('IS_USE_CACHE', false, convertTimeString(time));
    }
}
