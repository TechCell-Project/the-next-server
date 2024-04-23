import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '~/common/transformers';

export class AuthForgotPasswordDto {
    @ApiProperty({
        example: 'test@techcell.cloud',
        description: 'User email',
        required: true,
        type: String,
    })
    @Transform(lowerCaseTransformer)
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        example: 'http://localhost:3000',
        description: 'Return url',
        type: String,
    })
    @IsOptional()
    @IsString()
    @IsUrl({ require_tld: false })
    returnUrl?: string;
}
