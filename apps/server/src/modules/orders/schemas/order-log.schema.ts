import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class OrderLogSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String, format: 'ObjectId' })
    @Prop({ required: true, type: String })
    actorId: Types.ObjectId;

    @ApiProperty({ example: 'update status', type: String })
    @Prop({ required: true, type: String })
    action: string;

    @ApiPropertyOptional({ example: 'confirm order, pass order to warehouse', type: String })
    @Prop({ required: false, type: String, default: '' })
    note: string;
}
