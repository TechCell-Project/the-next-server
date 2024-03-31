import { AbstractRepository } from '~/common/abstract';
import { User } from './schemas';
import { PinoLogger } from 'nestjs-pino';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';

export class UsersRepository extends AbstractRepository<User> {
    protected readonly logger = new PinoLogger({
        renameContext: UsersRepository.name,
    });

    constructor(
        @InjectModel(User.name) userModel: Model<User>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection);
    }

    /**
     *
     * @param createProfileDto
     * @returns
     */
    async validateUserName(userName?: string) {
        let isUserNameExists = null;

        if (!userName) {
            while (!isUserNameExists) {
                const tempUserName = uuid();
                isUserNameExists =
                    (await this.count({
                        filterQuery: {
                            userName: tempUserName,
                        },
                    })) === 0
                        ? tempUserName
                        : null;
            }
        } else {
            isUserNameExists = userName;

            const isExists = await this.count({
                filterQuery: { userName: userName },
            });

            if (isExists) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            userName: 'userNameAlreadyExists',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        }

        return isUserNameExists;
    }
}
