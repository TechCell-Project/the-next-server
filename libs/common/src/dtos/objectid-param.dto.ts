import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ObjectIdParamDto {
    @ApiProperty({
        type: String,
        example: '66164ef6c4165e4833949722',
        format: 'ObjectId',
    })
    @IsMongoId()
    @IsNotEmpty()
    id: string;
}
