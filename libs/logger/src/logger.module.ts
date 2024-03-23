import { Module } from '@nestjs/common';
import { LoggerModule as PinoLogger } from 'nestjs-pino';

@Module({
    imports: [
        PinoLogger.forRootAsync({
            useFactory: () => {
                /**
                 * Can config some async/promise options here
                 */
                return {
                    pinoHttp: {
                        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                        transport:
                            process.env.NODE_ENV !== 'production'
                                ? { target: 'pino-pretty' }
                                : undefined,
                    },
                };
            },
        }),
    ],
})
export class LoggerModule {}
