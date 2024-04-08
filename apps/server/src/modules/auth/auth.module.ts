import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '~/modules/users';
import { JwtStrategy, AnonymousStrategy, JwtRefreshStrategy } from './strategies';
import { RedisModule } from '~/common/redis';
import { SessionModule } from '~/modules/session';
import { GhnModule } from '~/third-party';
import { RabbitMQModule } from '~/common';

@Module({
    imports: [
        JwtModule.register({}),
        PassportModule,
        SessionModule,
        UsersModule,
        RedisModule,
        GhnModule.forRoot({
            host: process.env.GHN_URL ?? '',
            token: process.env.GHN_API_TOKEN ?? '',
            shopId: +process.env.GHN_SHOP_ID! ?? 0,
            testMode: true,
        }),
        RabbitMQModule.registerRmq('COMMUNICATION_SERVICE', process.env.COMMUNICATION_QUEUE!),
    ],
    controllers: [AuthController],
    providers: [AuthService, AnonymousStrategy, JwtStrategy, JwtRefreshStrategy],
    exports: [AuthService],
})
export class AuthModule {}
