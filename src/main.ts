import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import validationOptions from '~/common/utils/validation-options';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = app.get(Logger);
    const configService = app.get(ConfigService);

    app.useLogger(app.get(Logger));
    app.enableShutdownHooks();
    app.use(helmet());
    app.setGlobalPrefix(configService.getOrThrow('API_PREFIX'), {
        exclude: ['/'],
    });
    app.useGlobalPipes(new ValidationPipe(validationOptions));

    const options = new DocumentBuilder()
        .setTitle('API')
        .setDescription('API docs')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    await app.listen(configService.getOrThrow('API_PORT')).then(() => {
        logger.log(`API live: http://localhost:${configService.getOrThrow('API_PORT')}`);
        logger.log(`API Docs: http://localhost:${configService.getOrThrow('API_PORT')}/docs`);
    });
}
bootstrap();
