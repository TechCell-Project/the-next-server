import { seeder } from 'nestjs-seeder';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema, UsersSeeder } from './modules/users';
import { Brand, BrandSchema, BrandsSeeder } from './modules/brands';

seeder({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI ?? ''),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    ],
}).run([UsersSeeder, BrandsSeeder]);
