import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttributeSchema {
    @ApiProperty({ example: 'ram' })
    @Prop({ required: true, type: String })
    k: string;

    @ApiProperty({ example: '8' })
    @Prop({ required: true, type: String })
    v: string;

    @ApiPropertyOptional({ example: 'GB' })
    @Prop({ required: false, type: String, default: '' })
    u: string;

    @ApiProperty({ example: 'RAM' })
    @Prop({ required: true, type: String })
    name: string;
}
