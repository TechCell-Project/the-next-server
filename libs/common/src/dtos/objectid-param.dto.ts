import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ObjectIdParamDto {
    @ApiProperty({
        type: String,
        example: '507f1f77bcf86cd799439011',
        format: 'ObjectId',
    })
    @IsMongoId()
    @IsNotEmpty()
    id: string;
}
