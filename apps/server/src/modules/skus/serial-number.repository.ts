import { AbstractRepository } from '~/common';
import { SerialNumber } from './schemas/serial-number.schema';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { SerialNumberStatusEnum } from './enums';

export class SerialNumberRepository extends AbstractRepository<SerialNumber> {
    constructor(
        protected readonly logger: PinoLogger,
        @InjectModel(SerialNumber.name) protected readonly serialNumberModel: Model<SerialNumber>,
        @InjectConnection() connection: Connection,
    ) {
        super(serialNumberModel, connection);
        this.logger.setContext(SerialNumberRepository.name);
    }

    addMany(skuId: Types.ObjectId, numbers: string[]) {
        return this.serialNumberModel.insertMany(
            numbers.map((number) => ({
                _id: new Types.ObjectId(),
                skuId,
                number,
                status: SerialNumberStatusEnum.Available,
            })),
        );
    }
}
