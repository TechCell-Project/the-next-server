import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotifyEventPattern } from './notify.pattern';
import { RabbitMQService } from '~/common/rabbitmq';
import { NotifyService } from './notify.service';

@Controller()
export class NotifyController {
    constructor(
        private readonly rabbitMqService: RabbitMQService,
        private readonly notifyService: NotifyService,
    ) {}

    @EventPattern(NotifyEventPattern.subscribeToTopic)
    subscribeToTopic(
        @Ctx() context: RmqContext,
        @Payload() data: { token: string; topic: string },
    ) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.notifyService.subscribeToTopic(data);
    }

    @EventPattern(NotifyEventPattern.unsubscribeToTopic)
    unsubscribeToTopic(
        @Ctx() context: RmqContext,
        @Payload() data: { token: string; topic: string },
    ) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.notifyService.unsubscribeToTopic(data);
    }

    @EventPattern(NotifyEventPattern.sendNotificationToTopic)
    sendNotification(
        @Ctx() context: RmqContext,
        @Payload() data: { topic: string; title: string; body: string; imageUrl?: string },
    ) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.notifyService.sendNotification(data);
    }
}
