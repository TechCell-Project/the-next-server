import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthFacebookLoginDto {
    @ApiProperty({ example: 'abc', type: String })
    @IsNotEmpty()
    accessToken: string;
}
