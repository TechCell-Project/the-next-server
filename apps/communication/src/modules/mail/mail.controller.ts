import { Controller } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendConfirmMailDto } from './dtos';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class MailController {
    constructor(private readonly mailService: MailService) {}

    @GrpcMethod('MailService', 'SendConfirmMailRequest')
    sendConfirmMail(data: SendConfirmMailDto) {
        return this.mailService.sendConfirmMail(data);
    }
}
