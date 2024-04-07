import { NestFactory } from '@nestjs/core';
import { CommunicationModule } from './communication.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(CommunicationModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'mail',
            protoPath: join(__dirname, '/modules/mail/mail.proto'),
        },
    });

    await app.startAllMicroservices();
    await app.listen(8001);
}

bootstrap();
