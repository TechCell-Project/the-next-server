import { Faker } from '@faker-js/faker';
import { Prop } from '@nestjs/mongoose';
import { Factory } from 'nestjs-seeder';
import { v4 as uuid } from 'uuid';

export class AvatarSchema {
    @Factory(() => uuid())
    @Prop({ required: true })
    publicId: string;

    @Factory((faker: Faker) => faker.internet.url())
    @Prop({ required: true })
    url: string;
}
