import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { lowerCaseTransformer } from '~/common/transformers';
import { UserRole } from '../enums';

export class CreateUserDto {
    @ApiProperty({
        example: 'example@techcell.cloud',
        description: "The user's email address.",
        required: true,
    })
    @Transform(lowerCaseTransformer)
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: 'John',
        description: "The user's first name.",
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: "The user's last name.",
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({
        example: 'techcell',
        description: "The user's username.",
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    userName?: string;

    @ApiProperty({
        example: 'admin',
        description: "The user's role.",
        required: true,
        enum: UserRole,
    })
    @IsNotEmpty()
    @IsEnum(UserRole)
    role: UserRole | string;

    socialId?: string;
    provider?: string;
}
