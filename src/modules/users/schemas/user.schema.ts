import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '~/common/abstract';
import { UserRole } from '../enums';
import { Factory } from 'nestjs-seeder';
import { Faker } from '@faker-js/faker';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
})
export class User extends AbstractDocument {
    @Factory((faker: Faker) => faker.internet.email({ provider: 'techcell.cloud' }))
    @Prop({ unique: true, required: true })
    email: string;

    @Factory((faker: Faker) => faker.internet.password())
    @Prop({ required: true })
    password: string;

    @Factory((faker: Faker) => faker.person.fullName())
    @Prop({
        type: String,
    })
    fullName: string;

    @Factory((faker: Faker) =>
        faker.helpers.arrayElement([
            UserRole.Accountant,
            UserRole.Customer,
            UserRole.DataEntry,
            UserRole.Sales,
            UserRole.Warehouse,
        ]),
    )
    @Prop({ type: String, enum: UserRole, required: true })
    role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
