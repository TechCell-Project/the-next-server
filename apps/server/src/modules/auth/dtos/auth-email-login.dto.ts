import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '~/common/transformers';

export class AuthEmailLoginDto {
    @ApiProperty({
        example: 'test@techcell.cloud',
        description: 'User email',
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'password',
        description: 'User password',
        required: true,
        type: String,
    })
    @IsNotEmpty()
    password: string;
}
