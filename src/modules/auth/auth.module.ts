import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '~/modules/users';
import { JwtStrategy, AnonymousStrategy, JwtRefreshStrategy } from './strategies';
import { RedisModule } from '~/common/redis';
import { SessionModule } from '~/modules/session';
import { MailModule } from '../mail';

@Module({
    imports: [
        JwtModule.register({}),
        PassportModule,
        MailModule,
        SessionModule,
        UsersModule,
        RedisModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, AnonymousStrategy, JwtStrategy, JwtRefreshStrategy],
    exports: [AuthService],
})
export class AuthModule {}
