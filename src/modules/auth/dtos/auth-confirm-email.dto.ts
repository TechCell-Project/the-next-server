import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthConfirmEmailDto {
    @ApiProperty({
        example: 'hash',
        required: true,
    })
    @IsNotEmpty()
    hash: string;
}
