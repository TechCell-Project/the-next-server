import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthGoogleLoginDto {
    @ApiPropertyOptional({ example: 'abc', type: String, description: 'Google ID Token' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    idToken?: string;

    @ApiPropertyOptional({ example: 'abc', type: String, description: 'Google Access Token' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    accessTokenGoogle?: string;
}
