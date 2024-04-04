import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { UserAddressSchema } from '~/modules/users/schemas/address.schema';

export class CustomerSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @Prop({ required: true, type: String })
    id: ObjectId;

    @ApiProperty({ example: '0123456789', type: String })
    @Prop({ required: true, type: String })
    phone: string;

    @ApiProperty({ example: 'john@example.com', type: String })
    @Prop({ required: true, type: String })
    email: string;

    @ApiProperty({
        example: {
            provinceId: 1,
            districtId: 2,
            wardCode: 3,
            customerName: 'John',
            type: 'home',
            detail: '123 ABC',
        },
        type: UserAddressSchema,
    })
    @Prop({ required: true, type: UserAddressSchema })
    address: UserAddressSchema;
}
