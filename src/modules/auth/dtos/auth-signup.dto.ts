import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '~/common/transformers';

export class AuthSignupDto {
    @ApiProperty({
        example: 'example@techcell.cloud',
        description: "The user's email address.",
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'john.doe',
        description: "The user's username.",
        required: false,
        type: String,
    })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    userName: string;

    @ApiProperty({
        example: 'password-will-secret',
        description: "The user's password.",
        minLength: 6,
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: 'John',
        description: "The user's first name.",
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: "The user's last name.",
        required: true,
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    lastName: string;
}
