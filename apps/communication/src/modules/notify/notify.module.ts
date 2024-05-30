import { Module } from '@nestjs/common';
import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';
import { RabbitMQService } from '~/common';
import { FirebaseModule } from '~/third-party/firebase';
import * as admin from 'firebase-admin';
import { resolve } from 'path';

@Module({
    imports: [
        FirebaseModule.forRoot({
            credential: admin.credential.cert(resolve(process.cwd(), 'firebase.json')),
            projectId: process.env.FIREBASE_PROJECT_ID,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        }),
    ],
    controllers: [NotifyController],
    providers: [NotifyService, RabbitMQService],
})
export class NotifyModule {}
