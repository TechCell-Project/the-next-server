import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthGoogleLoginDto {
    @ApiProperty({ example: 'abc', type: String })
    @IsNotEmpty()
    idToken: string;
}
