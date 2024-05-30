import { Injectable } from '@nestjs/common';
import { FirebaseService } from '~/third-party';

@Injectable()
export class NotifyService {
    constructor(private readonly firebaseServices: FirebaseService) {
        // TODO: Remove test topic before release
        this.firebaseServices.subscribeToTopic(
            'test',
            'f8o_jn_7uqf4O0ALnNzNyU:APA91bGwYbpR5g6qeSK7EqtWmY83SPOanDrUxjyUNAWr09-gaL9cxJbk97kRiWtTmXGRzTwxelcsFtZIqJv9usXprA9yr3oYNl6TKqk1awrzSTVKCyn1mB5aQdjIeZUE9ijpH0tYDAXb',
        );
    }

    subscribeToTopic(data: { token: string; topic: string }) {
        return this.firebaseServices.subscribeToTopic(data.topic, data.token);
    }

    unsubscribeToTopic(data: { token: string; topic: string }) {
        return this.firebaseServices.unsubscribeToTopic(data.topic, data.token);
    }

    sendNotification(data: { topic: string; title: string; body: string; imageUrl?: string }) {
        return this.firebaseServices.sendNotification(data);
    }
}
