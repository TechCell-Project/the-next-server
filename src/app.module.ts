import { Module } from '@nestjs/common';
import { LoggerModule } from '~/logger';
import { AppConfigModule } from '~/common/config';
import { RedisModule } from '~/common/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';

@Module({
    imports: [AppConfigModule, RedisModule, LoggerModule, AuthModule, UsersModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
