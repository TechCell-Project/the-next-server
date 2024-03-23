import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppService {
    constructor(private readonly logger: PinoLogger) {}

    getHello(): string {
        this.logger.info('HERE IS msg');
        return 'Hello World!';
    }
}
