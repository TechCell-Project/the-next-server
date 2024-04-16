import { AbstractRepository } from '~/common/abstract';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { Cart } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { NullableType } from '~/common';
import { RedlockService } from '~/common/redis';

@Injectable()
export class CartsRepository extends AbstractRepository<Cart> {
    constructor(
        @InjectModel(Cart.name) cartModel: Model<Cart>,
        @InjectConnection() connection: Connection,
        protected readonly logger: PinoLogger,
        private readonly redLock: RedlockService,
    ) {
        super(cartModel, connection);
        this.logger.setContext(CartsRepository.name);
    }

    async updateCartLockSession({ userId, products }: Omit<Cart, '_id'>, session?: ClientSession) {
        let result: NullableType<Cart>;
        const lock = await this.redLock.lock([`update_cart:${userId}`], 1000);

        try {
            result = await this.findOneAndUpdate({
                filterQuery: { userId },
                updateQuery: { products },
                ...(session ? { session } : {}),
            });
        } finally {
            await this.redLock.unlock(lock);
        }

        return result;
    }
}
