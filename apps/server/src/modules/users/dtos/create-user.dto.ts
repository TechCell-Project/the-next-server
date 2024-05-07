import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { lowerCaseTransformer } from '~/common/transformers';
import { RolesWithoutCustomerAndManager, UserRoleEnum } from '../enums';

export class CreateUserDto {
    @ApiProperty({
        example: 'example@techcell.cloud',
        description: "The user's email address.",
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password-will-secret',
        description: "The user's password.",
        minLength: 6,
        type: String,
    })
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

    @ApiProperty({
        description: "The user's role.",
        required: true,
        enum: RolesWithoutCustomerAndManager,
        example: UserRoleEnum.Sales,
        type: String,
    })
    @IsNotEmpty()
    @IsEnum(RolesWithoutCustomerAndManager)
    role: UserRoleEnum | string;

    socialId?: string;
    provider?: string;
}
