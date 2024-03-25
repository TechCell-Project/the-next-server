import { ApiProperty } from '@nestjs/swagger';
import { User } from '~/modules/users';

export class LoginResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    accessTokenExpires: number;

    @ApiProperty()
    refreshToken: string;

    @ApiProperty({ type: User })
    user: User;
}
