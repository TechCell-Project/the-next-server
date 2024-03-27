import { ApiProperty } from '@nestjs/swagger';
import { User } from '~/modules/users';

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' })
    accessToken: string;

    @ApiProperty({ example: 3600 })
    accessTokenExpires: number;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' })
    refreshToken: string;

    @ApiProperty({ type: User })
    user: User;
}
