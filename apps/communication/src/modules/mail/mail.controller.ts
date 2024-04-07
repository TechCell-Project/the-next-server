import { Controller } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendConfirmMailDto, SendForgotPasswordDto } from './dtos';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MailEventPattern } from './mail.pattern';
import { RabbitMQService } from '~/common/rabbitmq';

@Controller()
export class MailController {
    constructor(
        private readonly mailService: MailService,
        private readonly rabbitMqService: RabbitMQService,
    ) {}

    @MessagePattern(MailEventPattern.sendConfirmMail)
    sendConfirmMail(@Ctx() context: RmqContext, @Payload() data: SendConfirmMailDto) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.mailService.sendConfirmMail(data);
    }

    @MessagePattern(MailEventPattern.sendForgotPassword)
    sendForgotPassword(@Ctx() context: RmqContext, @Payload() data: SendForgotPasswordDto) {
        this.rabbitMqService.acknowledgeMessage(context);
        return this.mailService.sendForgotPassword(data);
    }
}
