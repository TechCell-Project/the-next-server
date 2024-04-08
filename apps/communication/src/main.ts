import { NestFactory } from '@nestjs/core';
import { CommunicationModule } from './communication.module';
import { Logger } from 'nestjs-pino';
import { RabbitMQService } from '~/common/rabbitmq';

async function bootstrap() {
    const app = await NestFactory.create(CommunicationModule, { bufferLogs: true });
    const port = process.env.COMMUNICATION_PORT || 8001;

    const logger = app.get(Logger);
    app.useLogger(logger);

    RabbitMQService.connectRabbitMQ({
        app,
        queueNameEnv: 'COMMUNICATION_QUEUE',
        inheritAppConfig: true,
        logger,
    });

    await app.startAllMicroservices();
    await app.listen(port).then(() => {
        logger.log(`Communication service is running on: ${port}`);
    });
}

bootstrap();
