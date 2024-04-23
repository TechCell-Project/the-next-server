import { Module } from '@nestjs/common';
import { AppConfigModule } from '~/common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLogger } from 'nestjs-pino';

@Module({
    imports: [
        PinoLogger.forRootAsync({
            imports: [AppConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                /**
                 * Can config some async/promise options here
                 */
                return {
                    pinoHttp: {
                        level:
                            config.getOrThrow<string>('nodeEnv') !== 'production'
                                ? 'debug'
                                : 'info',
                        transport:
                            config.getOrThrow<string>('nodeEnv') !== 'production'
                                ? { target: 'pino-pretty' }
                                : undefined,
                    },
                };
            },
        }),
    ],
})
export class LoggerModule {}
