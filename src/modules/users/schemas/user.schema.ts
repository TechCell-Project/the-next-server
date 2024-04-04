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
import { NullableType } from '~/common';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User extends AbstractDocument {
    constructor(data?: NullableType<User>) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({
        type: String,
        example: 'example@techcell.cloud',
    })
    @Factory((faker: Faker) => faker.internet.email({ provider: 'techcell.cloud' }))
    @Prop({ unique: true, required: true })
    email: string;

    @Expose({ groups: ['me', 'manager'] })
    @ApiProperty({
        type: Boolean,
        example: true,
    })
    @Factory((faker: Faker) => faker.datatype.boolean())
    @Prop({ default: false })
    emailVerified: boolean;

    @Expose({ groups: ['me', 'manager'] })
    @ApiProperty({
        example: AuthProvider.Email,
        enum: AuthProvider,
        type: String,
    })
    @Factory((faker: Faker) => faker.helpers.enumValue(AuthProvider))
    @Prop({ required: true, type: String, enum: AuthProvider, default: AuthProvider.Email })
    provider: string;

    @Expose({ groups: ['me', 'manager'] })
    @ApiPropertyOptional({
        example: '12345',
        type: String,
    })
    @Factory(() => null)
    @Expose({ groups: ['me', 'manager'], toPlainOnly: true })
    @Prop({
        type: String,
        default: null,
    })
    socialId?: string | null;

    @ApiHideProperty()
    @Exclude({ toPlainOnly: true })
    @Factory((faker: Faker) => faker.internet.password())
    @Prop({ required: true })
    password: string;

    @ApiProperty({
        example: 'John',
    })
    @Factory((faker: Faker) => faker.person.firstName())
    @Prop({
        type: String,
    })
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        type: String,
    })
    @Factory((faker: Faker) => faker.person.lastName())
    @Prop({
        type: String,
    })
    lastName: string;

    @ApiProperty({
        example: 'john.doe',
        type: String,
    })
    @Factory((faker: Faker, ctx) =>
        faker.internet.userName({ firstName: ctx?.firstName, lastName: ctx?.lastName }),
    )
    @Prop({ required: true, unique: true })
    userName: string;

    @Expose({ groups: ['me', 'manager'] })
    @ApiProperty({
        example: UserRole.Customer,
        enum: UserRole,
        type: String,
    })
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

    @ApiPropertyOptional({
        type: AvatarSchema,
    })
    @Prop({ type: AvatarSchema })
    avatar?: AvatarSchema;

    @ApiPropertyOptional({
        type: [UserAddressSchema],
    })
    @Prop({ type: [UserAddressSchema], default: [] })
    address?: UserAddressSchema[];

    @ApiPropertyOptional({
        type: UserBlockSchema,
    })
    @Expose({ groups: [UserRole.Manager], toPlainOnly: true })
    @Prop({ type: UserBlockSchema, default: {} })
    block?: UserBlockSchema;
}

export const UserSchema = SchemaFactory.createForClass(User);
