import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { NullableType } from '~/common/types';
import { Session } from './session.schema';
import { FilterQuery } from 'mongoose';
import { User } from '../users';

@Injectable()
export class SessionService {
    constructor(private readonly sessionRepository: SessionRepository) {}

    findOne(options: FilterQuery<Session>): Promise<NullableType<Session>> {
        return this.sessionRepository.getSession(options);
    }

    create(data: Omit<Session, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Session> {
        return this.sessionRepository.createSession({ document: data });
    }

    update(
        id: Session['_id'],
        payload: Partial<Omit<Session, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
    ): Promise<Session | null> {
        return this.sessionRepository.updateSession(id, payload);
    }

    async softDelete(criteria: {
        id?: Session['_id'];
        user?: Pick<User, '_id'>;
        excludeId?: Session['_id'];
    }): Promise<void> {
        await this.sessionRepository.softDeleteSession(criteria);
    }
}
