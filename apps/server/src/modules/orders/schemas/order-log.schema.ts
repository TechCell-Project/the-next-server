import { Prop } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { OrderActionEnum } from '../enum';
import { User } from '~/server/users';

export class Actor extends PickType(User, ['_id', 'firstName', 'lastName', 'role']) {
    constructor(data: User) {
        super();
        this._id = data._id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.role = data.role;
    }
}

export class OrderLogSchema {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: Actor })
    @ApiProperty({ type: Actor, required: true })
    actor: Actor;

    @ApiProperty({ example: OrderActionEnum.CancelByCustomer, type: String, enum: OrderActionEnum })
    @Prop({ required: true, type: String, enum: OrderActionEnum })
    action: OrderActionEnum;

    @ApiProperty({ example: '2020-01-01T00:00:00.000Z', type: Date })
    @Prop({ required: true, type: Date })
    actionAt: Date;

    @ApiPropertyOptional({ example: 'confirm order, pass order to warehouse', type: String })
    @Prop({ required: false, type: String, default: '' })
    note: string;
}
