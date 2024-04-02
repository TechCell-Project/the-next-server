import { PinoLogger } from 'nestjs-pino';
import { AbstractDocument } from './abstract.schema';
import {
    Model,
    Connection,
    SaveOptions,
    ClientSession,
    Types,
    FilterQuery,
    QueryOptions,
    ProjectionType,
    UpdateQuery,
} from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { NullableType } from '~/common/types';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
    protected abstract readonly logger: PinoLogger;

    constructor(
        protected readonly model: Model<TDocument>,
        private readonly connection: Connection,
    ) {}

    async create({
        document,
        saveOptions,
        session,
    }: {
        document: Omit<TDocument, '_id'>;
        saveOptions?: SaveOptions;
        session?: ClientSession;
    }): Promise<TDocument> {
        const createdDocument = new this.model({
            _id: new Types.ObjectId(),
            ...document,
        });
        return (
            await createdDocument.save({ ...saveOptions, session })
        ).toJSON() as unknown as TDocument;
    }

    async findOne({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<NullableType<TDocument>> {
        const document = await this.model
            .findOne(filterQuery, projectionType, {
                ...queryOptions,
            })
            .lean(queryOptions?.lean ?? true);
        return document as unknown as TDocument;
    }

    async findOneOrThrow({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<TDocument> {
        const document = await this.findOne({
            filterQuery,
            queryOptions,
            projectionType,
        });

        if (!document) {
            this.logger.warn(`${this.model.modelName} not found with filterQuery`, filterQuery);
            throw new NotFoundException(`${this.model.modelName} not found!`);
        }

        return document as unknown as TDocument;
    }

    async findOneAndUpdate({
        filterQuery,
        updateQuery,
        queryOptions,
        session,
    }: {
        filterQuery: FilterQuery<TDocument>;
        updateQuery: UpdateQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;

        session?: ClientSession;
    }): Promise<NullableType<TDocument>> {
        if (updateQuery?._id) {
            delete updateQuery._id;
        }

        const document = await this.model.findOneAndUpdate(filterQuery, updateQuery, {
            lean: true,
            new: true,
            ...queryOptions,
            session,
        });
        return document ?? null;
    }

    async findOneAndUpdateOrThrow({
        filterQuery,
        updateQuery,
        queryOptions,
        session,
    }: {
        filterQuery: FilterQuery<TDocument>;
        updateQuery: UpdateQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        session?: ClientSession;
    }): Promise<TDocument> {
        if (updateQuery?._id) {
            delete updateQuery._id;
        }

        const document = await this.findOneAndUpdate({
            filterQuery,
            updateQuery,
            queryOptions,
            session,
        });
        if (!document) {
            this.logger.warn(`${this.model.modelName} not found with filterQuery:`, filterQuery);
            throw new NotFoundException(`${this.model.modelName} not found!`);
        }

        return document;
    }

    async upsert(filterQuery: FilterQuery<TDocument>, document: Partial<TDocument>) {
        if (document?._id) {
            delete document._id;
        }

        return this.model.findOneAndUpdate(filterQuery, document, {
            lean: true,
            upsert: true,
            new: true,
        });
    }

    async find({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<NullableType<TDocument[]>> {
        const document = await this.model.find(filterQuery, projectionType, {
            lean: true,
            ...queryOptions,
        });

        return document ?? null;
    }

    async findOrThrow({
        filterQuery,
        queryOptions,
        projectionType,
    }: {
        filterQuery: FilterQuery<TDocument>;
        queryOptions?: Partial<QueryOptions<TDocument>>;
        projectionType?: ProjectionType<TDocument>;
    }): Promise<TDocument[]> {
        const document = await this.find({
            filterQuery,
            queryOptions,
            projectionType,
        });

        if (!document || document.length <= 0) {
            this.logger.warn(`${this.model.modelName}s not found with filterQuery:`, filterQuery);
            throw new NotFoundException(`${this.model.modelName}s not found`);
        }

        return document;
    }

    async count(filterQuery: FilterQuery<TDocument>): Promise<number> {
        return this.model.countDocuments(filterQuery);
    }

    async startTransaction(): Promise<ClientSession> {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
    }

    async commitTransaction(session: ClientSession): Promise<void> {
        await session.commitTransaction();
        session.endSession();
    }

    async rollbackTransaction(session: ClientSession): Promise<void> {
        await session.abortTransaction();
        session.endSession();
    }
}
