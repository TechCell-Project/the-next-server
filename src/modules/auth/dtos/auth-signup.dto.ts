import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '~/common/transformers';

export class AuthSignupDto {
    @ApiProperty({
        example: 'example@techcell.cloud',
        description: "The user's email address.",
        required: true,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'john.doe',
        description: "The user's username.",
        required: false,
    })
    @IsOptional()
    @IsString()
    userName: string;

    @ApiProperty({
        example: 'password-will-secret',
        description: "The user's password.",
        minLength: 6,
        required: true,
    })
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: 'John',
        description: "The user's first name.",
        required: true,
    })
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: "The user's last name.",
        required: true,
    })
    @IsNotEmpty()
    lastName: string;
}
