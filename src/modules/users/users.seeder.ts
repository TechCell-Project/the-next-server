import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { Seeder, DataFactory } from 'nestjs-seeder';
import { UserRole } from './enums';

@Injectable()
export class UsersSeeder implements Seeder {
    constructor(@InjectModel(User.name) private readonly user: Model<User>) {}

    async seed(): Promise<any> {
        // Generate 100 users.
        const users = DataFactory.createForClass(User).generate(100);

        // First user is a manager.
        (users[0] as unknown as User).role = UserRole.Manager;

        // Assign an ID to each user. Avoiding duplicates.
        users.forEach((u) => {
            return Object.assign(u, { _id: new Types.ObjectId() });
        });

        // Insert into the database.
        return this.user.insertMany(users);
    }

    async drop(): Promise<any> {
        return this.user.deleteMany({});
    }
}
