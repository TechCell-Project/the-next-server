import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { AbstractDocument } from '~/common';
import { User } from '../users';

@Schema({
    collection: 'sessions',
    timestamps: true,
    toJSON: {
        virtuals: true,
        getters: true,
    },
})
export class Session extends AbstractDocument {
    constructor(data?: Partial<Session>) {
        super();
        Object.assign(this, data);
    }

    @Prop({ type: Types.ObjectId, ref: 'user' })
    user: User;

    @Prop()
    hash: string;

    @Prop({ default: now })
    createdAt: Date;

    @Prop({ default: now })
    updatedAt: Date;

    @Prop()
    deletedAt: Date;
}

export type SessionSchemaDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ user: 1 });
