import { AbstractRepository } from '~/common';
import { Tag } from './schemas';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';

export class TagRepository extends AbstractRepository<Tag> {
    constructor(
        @InjectModel(Tag.name) protected readonly tagModel: Model<Tag>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
    ) {
        super(tagModel, connection);
    }
}
