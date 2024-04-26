import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelOrderDto {
    @ApiProperty({ type: String, description: 'Cancel reason' })
    @IsString()
    reason: string;
}
