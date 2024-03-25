import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { Factory } from 'nestjs-seeder';
import { Faker } from '@faker-js/faker';
import { AbstractDocument } from '~/common/abstract';
import { AuthProvider, UserRole } from '../enums';
import { AvatarSchema } from './avatar.schema';
import { UserAddressSchema } from './address.schema';
import { UserBlockSchema } from './block.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User extends AbstractDocument {
    @Factory((faker: Faker) => faker.internet.email({ provider: 'techcell.cloud' }))
    @Prop({ unique: true, required: true })
    email: string;

    @Factory((faker: Faker) => faker.datatype.boolean())
    @Prop({ default: false })
    emailVerified: boolean;

    @Factory((faker: Faker) => faker.helpers.enumValue(AuthProvider))
    @Prop({ required: true, type: String, enum: AuthProvider, default: AuthProvider.Email })
    provider: string;

    @Factory(() => null)
    @Expose({ groups: ['me', 'manager'], toPlainOnly: true })
    @Prop({
        type: String,
        default: null,
    })
    socialId?: string | null;

    @Exclude({ toPlainOnly: true })
    @Factory((faker: Faker) => faker.internet.password())
    @Prop({ required: true })
    password: string;

    @Factory((faker: Faker) => faker.person.firstName())
    @Prop({
        type: String,
    })
    firstName: string;

    @Factory((faker: Faker) => faker.person.lastName())
    @Prop({
        type: String,
    })
    lastName: string;

    @Factory((faker: Faker, ctx) =>
        faker.internet.userName({ firstName: ctx?.firstName, lastName: ctx?.lastName }),
    )
    @Prop({ required: true, unique: true })
    userName: string;

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

    @Prop({ type: AvatarSchema })
    avatar?: AvatarSchema;

    @Prop({ type: [UserAddressSchema], default: [] })
    address?: UserAddressSchema[];

    @Expose({ groups: [UserRole.Manager], toPlainOnly: true })
    @Prop({ type: UserBlockSchema, default: {} })
    block?: UserBlockSchema;
}

export const UserSchema = SchemaFactory.createForClass(User);
