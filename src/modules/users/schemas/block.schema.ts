import { Prop } from '@nestjs/mongoose';
import { BlockAction } from '../enums';
import { Types } from 'mongoose';

class BlockActivityLog {
    @Prop({ required: true, type: String, enum: BlockAction })
    action: string;

    @Prop({ required: true, type: Date, default: Date.now })
    actionAt: Date;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    actionBy: Types.ObjectId;

    @Prop({ required: true, type: String })
    reason: string;

    @Prop({ type: String, default: '' })
    note: string;
}

export class UserBlockSchema {
    @Prop({ default: false })
    isBlocked: boolean;

    @Prop({ type: [BlockActivityLog], default: [] })
    activityLogs: BlockActivityLog[];
}
