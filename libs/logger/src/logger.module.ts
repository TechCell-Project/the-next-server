import { Module } from '@nestjs/common';
import { AppConfigModule } from '~/common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLogger } from 'nestjs-pino';
import { isTrueSet } from '~/common';
import { Request } from 'express';

@Module({
    imports: [
        PinoLogger.forRootAsync({
            imports: [AppConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                /**
                 * Can config some async/promise options here
                 */
                const isProduction = config.getOrThrow<string>('nodeEnv') === 'production';
                const disableLogger = isTrueSet(config.get<boolean>('DISABLE_LOGGER', false));

                if (disableLogger) {
                    return {
                        pinoHttp: {
                            enabled: false,
                        },
                    };
                }

                return {
                    pinoHttp: {
                        level: isProduction ? 'info' : 'debug',
                        transport: isProduction ? undefined : { target: 'pino-pretty' },
                        ...(isProduction
                            ? {}
                            : {
                                  serializers: {
                                      req: (req: Request) => ({
                                          id: req.id,
                                          method: req.method,
                                          url: req.url,
                                      }),
                                  },
                              }),
                    },
                };
            },
        }),
    ],
})
export class LoggerModule {}
