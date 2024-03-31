import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ObjectIdParamDto {
    @ApiProperty({
        type: String,
        example: new Types.ObjectId(),
        format: 'ObjectId',
    })
    @IsMongoId()
    @IsNotEmpty()
    id: string;
}
