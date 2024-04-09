import { Body, Controller, Post } from '@nestjs/common';
import { CreateSkuDto } from './dtos';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('skus')
@Controller({
    path: 'skus',
})
export class SkusController {
    @Post('/')
    async createSku(@Body() data: CreateSkuDto) {
        return 'TODO';
    }
}
