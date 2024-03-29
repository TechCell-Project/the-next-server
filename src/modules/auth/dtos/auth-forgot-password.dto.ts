import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '~/common/transformers';

export class AuthForgotPasswordDto {
    @ApiProperty({
        example: 'test@techcell.cloud',
        description: 'User email',
        required: true,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    email: string;
}
