import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common';
import { SerialNumberStatusEnum } from '../enums';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'serial-numbers',
})
export class SerialNumber extends AbstractDocument {
    constructor(document: Partial<SerialNumber>) {
        super();
        Object.assign(this, document);
    }

    @Prop({ required: true, type: String, unique: true })
    number: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'skus' })
    skuId: Types.ObjectId;

    @Prop({ required: true, type: String, enum: SerialNumberStatusEnum })
    status: SerialNumberStatusEnum;
}

export type SerialNumberDocument = HydratedDocument<SerialNumber>;
export const SerialNumberSchema = SchemaFactory.createForClass(SerialNumber);
