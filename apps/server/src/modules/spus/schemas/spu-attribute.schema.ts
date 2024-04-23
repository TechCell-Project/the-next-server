import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttributeInProductSchema {
    @ApiProperty({ example: 'ram', type: String })
    @Prop({ required: true, type: String })
    k: string;

    @ApiProperty({ example: '8', type: String })
    @Prop({ required: true, type: String })
    v: string;

    @ApiPropertyOptional({ example: 'GB', type: String })
    @Prop({ required: false, type: String, default: '' })
    u: string;

    @ApiProperty({ example: 'RAM', type: String })
    @Prop({ required: true, type: String })
    name: string;
}
