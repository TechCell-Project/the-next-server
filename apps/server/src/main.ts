import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import {
    ClassSerializerInterceptor,
    ForbiddenException,
    HttpException,
    ValidationPipe,
} from '@nestjs/common';
import validationOptions from '~/common/utils/validation-options';
import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { ResolvePromisesInterceptor } from '~/common/utils';
import * as swaggerStats from 'swagger-stats';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { RabbitMQService } from '~/common/rabbitmq';
import { AuthService } from './modules/auth/auth.service';
import { UserRoleEnum } from './modules/users/enums';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = app.get(Logger);
    const configService = app.get(ConfigService);

    RabbitMQService.connectRabbitMQ({
        app,
        queueNameEnv: 'SERVER_QUEUE',
        logger,
    });

    app.enableCors();
    app.useLogger(app.get(Logger));
    app.enableShutdownHooks();
    app.use(helmet());
    app.setGlobalPrefix(configService.getOrThrow('API_PREFIX'), {
        exclude: ['/'],
    });
    app.useGlobalPipes(new ValidationPipe(validationOptions));
    app.useGlobalInterceptors(
        // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
        // https://github.com/typestack/class-transformer/issues/549
        new ResolvePromisesInterceptor(),
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    const swaggerDocumentConfig = new DocumentBuilder()
        .setTitle('TechCell RESTful API Documentations')
        .setContact('TechCell Teams', 'https://techcell.cloud', 'teams@techcell.cloud')
        .setDescription('The documentations of the TechCell RESTful API')
        .setVersion('1.0')
        .setLicense(
            'MIT LICENSE',
            'https://github.com/TechCell-Project/the-next-server?tab=MIT-1-ov-file',
        )
        .setExternalDoc('TechCell Github', 'https://github.com/TechCell-Project/the-next-server')
        .addServer('https://api.techcell.cloud')
        .addServer('http://localhost:8000')
        .addBearerAuth()
        .build();

    const swaggerDocumentOptions: SwaggerDocumentOptions = {};
    const document = SwaggerModule.createDocument(
        app,
        swaggerDocumentConfig,
        swaggerDocumentOptions,
    );
    const swaggerCustomOptions: SwaggerCustomOptions = {
        customSiteTitle: 'TechCell RESTful API documentations',
        customCss: new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.NORD_DARK),
    };
    SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

    const authService = app.get(AuthService);
    // Use swagger-stats to generate statistics
    app.use(
        swaggerStats.getMiddleware({
            uriPath: '/api-stats',
            swaggerSpec: document,
            name: 'TechCell API statistics',
            hostname: 'api.techcell.cloud',
            timelineBucketDuration: 180000,
            authentication: true,
            async onAuthenticate(req, username, password) {
                if (
                    username === configService.getOrThrow<string>('API_STATS_USERNAME') &&
                    password === configService.getOrThrow<string>('API_STATS_PASSWORD')
                ) {
                    return true;
                }

                try {
                    const user = await authService.validateLogin({
                        email: username,
                        password: password,
                    });

                    if (user && user.user.role === UserRoleEnum.Customer) {
                        throw new ForbiddenException('Forbidden');
                    }

                    return true;
                } catch (error) {
                    if (error instanceof HttpException) {
                        throw error;
                    }
                    throw new ForbiddenException('Forbidden');
                }
            },
        }),
    );

    await app.startAllMicroservices();
    await app.listen(configService.getOrThrow('API_PORT')).then(() => {
        logger.log(`API live: http://localhost:${configService.getOrThrow('API_PORT')}`);
        logger.log(`API stats: http://localhost:${configService.getOrThrow('API_PORT')}/api-stats`);
        logger.log(`API Docs: http://localhost:${configService.getOrThrow('API_PORT')}/docs`);
    });
}
bootstrap();
