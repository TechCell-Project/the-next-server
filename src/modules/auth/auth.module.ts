import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users';
import { JwtStrategy, AnonymousStrategy } from './strategies';

@Module({
    imports: [JwtModule.register({}), PassportModule, UsersModule],
    controllers: [AuthController],
    providers: [AuthService, AnonymousStrategy, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
