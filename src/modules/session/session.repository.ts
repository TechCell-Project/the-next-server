import { AbstractRepository, NullableType, convertToObjectId } from '~/common';
import { Session } from './session.schema';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, FilterQuery, Model, SaveOptions, Types } from 'mongoose';
import { User } from '../users';

export class SessionRepository extends AbstractRepository<Session> {
    constructor(
        @InjectModel(Session.name) private sessionModel: Model<Session>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
    ) {
        super(sessionModel, connection);
        this.logger.setContext(SessionRepository.name);
    }

    async getSession(fields: FilterQuery<Session>): Promise<NullableType<Session>> {
        if (fields?._id) {
            const sessionObject = await this.findOne({
                filterQuery: {
                    _id: convertToObjectId(fields._id),
                },
            });
            return sessionObject ? new Session(sessionObject) : null;
        }

        return this.findOne({
            filterQuery: fields,
        });
    }

    async createSession({
        document,
        saveOptions,
        session,
    }: {
        document: Omit<Session, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
        saveOptions?: SaveOptions;
        session?: ClientSession;
    }): Promise<Session> {
        const createdDocument = new this.model({
            _id: new Types.ObjectId(),
            ...document,
        });
        return createdDocument.save({ ...saveOptions, session });
    }

    async updateSession(id: Session['_id'], payload: Partial<Session>): Promise<Session | null> {
        const clonedPayload = { ...payload };
        delete clonedPayload._id;
        delete clonedPayload.createdAt;
        delete clonedPayload.updatedAt;
        delete clonedPayload.deletedAt;

        const filter = { _id: id };

        return this.findOneAndUpdate({
            filterQuery: filter,
            updateQuery: clonedPayload,
        });
    }

    async softDeleteSession({
        excludeId,
        ...criteria
    }: {
        id?: Session['_id'];
        user?: Pick<User, '_id'>;
        excludeId?: Session['_id'];
    }): Promise<void> {
        const transformedCriteria = {
            user: criteria.user?._id ?? undefined,
            _id: criteria.id ? criteria.id : excludeId ? { $not: { $eq: excludeId } } : undefined,
        };
        await this.sessionModel.updateMany(transformedCriteria);
    }
}
