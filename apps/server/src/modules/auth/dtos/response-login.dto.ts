import { ApiProperty } from '@nestjs/swagger';
import { User } from '~/modules/users';

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', type: String })
    accessToken: string;

    @ApiProperty({ example: 3600, type: Number })
    accessTokenExpires: number;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', type: String })
    refreshToken: string;

    @ApiProperty({ type: User })
    user: User;
}
