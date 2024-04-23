import { AbstractRepository } from '~/common/abstract';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { Cart } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { NullableType } from '~/common';
import { RedlockService } from '~/common/redis';
import { ExecutionError, Lock } from 'redlock';

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
        let lock: Lock | null = null;

        try {
            lock = await this.redLock.lock([`update_cart:${userId}`], 3000);
            result = await this.findOneAndUpdate({
                filterQuery: { userId },
                updateQuery: { products },
                ...(session ? { session } : {}),
            });
        } catch (error) {
            if (error instanceof ExecutionError) {
                throw new HttpException(
                    {
                        errors: {
                            cart: 'cartIsUpdating',
                        },
                    },
                    HttpStatus.CONFLICT,
                );
            }
            throw error;
        } finally {
            if (lock) {
                await this.redLock.unlock(lock);
            }
        }

        return result;
    }
}
