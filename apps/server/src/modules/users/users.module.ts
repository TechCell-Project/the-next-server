import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { User, UserSchema } from './schemas';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { RabbitMQService } from '~/common/rabbitmq';

@Module({
    imports: [MongodbModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [UsersController],
    providers: [UsersRepository, UsersService, RabbitMQService],
    exports: [UsersService],
})
export class UsersModule {}
