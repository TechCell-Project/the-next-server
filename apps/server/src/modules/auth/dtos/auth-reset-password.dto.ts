import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthResetPasswordDto {
    @ApiProperty({
        example: 'password',
        description: 'User new password',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: 'hash',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    hash: string;
}
