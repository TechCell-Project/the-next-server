import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { UserAddressSchema } from '~/server/users/schemas/address.schema';

export class CustomerSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Prop({ required: true, type: String })
    customerId: Types.ObjectId;

    @ApiProperty({ example: 'john@example.com', type: String })
    @Prop({ required: true, type: String })
    email: string;

    @ApiProperty({
        type: UserAddressSchema,
    })
    @Prop({ required: true, type: UserAddressSchema })
    address: UserAddressSchema;
}
