import { Module } from '@nestjs/common';
import { AuthGoogleService } from './auth-google.service';
import { ConfigModule } from '@nestjs/config';
import { AuthGoogleController } from './auth-google.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [ConfigModule, AuthModule, HttpModule],
    controllers: [AuthGoogleController],
    providers: [AuthGoogleService],
    exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
