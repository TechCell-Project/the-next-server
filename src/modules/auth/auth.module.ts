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
import { GhnModule } from '~/third-party';

@Module({
    imports: [
        JwtModule.register({}),
        PassportModule,
        MailModule,
        SessionModule,
        UsersModule,
        RedisModule,
        GhnModule.forRoot({
            host: process.env.GHN_URL ?? '',
            token: process.env.GHN_API_TOKEN ?? '',
            shopId: +process.env.GHN_SHOP_ID! ?? 0,
            testMode: true,
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AnonymousStrategy, JwtStrategy, JwtRefreshStrategy],
    exports: [AuthService],
})
export class AuthModule {}
