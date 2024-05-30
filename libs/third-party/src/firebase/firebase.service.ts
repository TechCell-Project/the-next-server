import { Inject, Injectable, Logger } from '@nestjs/common';
import { initializeApp, App, AppOptions } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService {
    private readonly logger = new Logger(FirebaseService.name);
    private readonly firebaseApp: App;
    private readonly messaging: Messaging;
    private topicMap: Record<string, string[]>;

    constructor(@Inject('FIREBASE_INIT_OPTIONS') private readonly config: AppOptions) {
        this.firebaseApp = initializeApp(this.config, 'techcell');
        this.messaging = getMessaging(this.firebaseApp);
        this.topicMap = {};
    }

    subscribeToTopic(topic: string, token: string) {
        if (!this.topicMap[topic]) {
            this.topicMap[topic] = [];
        }

        if (this.topicMap[topic].find((t) => t === token)) {
            return;
        }

        this.topicMap[topic].push(token);
        return this.messaging.subscribeToTopic(this.topicMap[topic], topic);
    }

    unsubscribeToTopic(topic: string, token: string) {
        if (!this.topicMap[topic]) {
            return;
        }

        this.topicMap[topic] = this.topicMap[topic].filter((t) => t !== token);
        return this.messaging.unsubscribeFromTopic(token, topic);
    }

    sendNotification(data: { topic: string; title: string; body: string; imageUrl?: string }) {
        this.logger.log(`Sending notification to topic: ${data.topic}`);
        return this.messaging.send({
            topic: data.topic,
            notification: {
                title: data.title,
                body: data.body,
                imageUrl: data?.imageUrl,
            },
        });
    }
}
