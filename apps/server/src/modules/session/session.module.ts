import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Session, SessionSchema } from './session.schema';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    ],
    providers: [SessionRepository, SessionService],
    exports: [SessionService],
})
export class SessionModule {}
