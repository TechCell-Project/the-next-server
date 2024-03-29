import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendConfirmEmail {
    @ApiProperty({ example: 'test1@techcell.cloud', required: true })
    @IsEmail()
    email: string;
}
