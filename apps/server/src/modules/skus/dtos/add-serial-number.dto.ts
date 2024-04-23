import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class AddSerialNumberDto {
    @ApiProperty({
        type: [String],
        description: 'Serial numbers',
        example: ['IP119908231', 'NDC222310332'],
    })
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MinLength(6, { each: true })
    @MaxLength(32, { each: true })
    serialNumbers: string[];
}
