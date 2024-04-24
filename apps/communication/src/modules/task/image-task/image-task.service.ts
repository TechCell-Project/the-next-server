import { Cron } from '@nestjs/schedule';
import { Inject, Injectable } from '@nestjs/common';
import { CloudinaryService } from '~/third-party/cloudinary.com';
import { firstValueFrom } from 'rxjs';
import { ClientRMQ } from '@nestjs/microservices';
import { SkusPattern } from '~/server/skus/skus.pattern';
import { PinoLogger } from 'nestjs-pino';
import { SpusPattern } from '~/server/spus';
import { UsersPattern } from '~/server/users';

@Injectable()
export class ImageTaskService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly cloudinaryService: CloudinaryService,
        @Inject('SERVER_SERVICE') private readonly serverService: ClientRMQ,
    ) {
        this.logger.setContext(ImageTaskService.name);
    }

    /**
     * Auto remove unused image in cloudinary on 7:00 AM every day
     * @param next_cursor
     */
    @Cron('0 7 * * *')
    async removeUnusedImage(next_cursor?: string, maxResults?: number) {
        const RESULT_PER_REQUEST = 100;

        this.logger.info('Start remove unused image in cloudinary on 7:00 AM every day');
        // Prepare data for remove unused image
        const images = await this.cloudinaryService.getImagesInFolder({
            maxResults: maxResults || RESULT_PER_REQUEST,
            next_cursor,
        });

        // Remove unused image
        for (const image of images.resources) {
            this.logger.info(`Check image ${image.public_id}`);
            const [...inUseArray] = await Promise.all([
                firstValueFrom(
                    this.serverService
                        .send(SkusPattern.isImageInUse, {
                            publicId: image.public_id,
                        })
                        .pipe(),
                ),
                firstValueFrom(
                    this.serverService
                        .send(SpusPattern.isImageInUse, {
                            publicId: image.public_id,
                        })
                        .pipe(),
                ),
                firstValueFrom(
                    this.serverService
                        .send(UsersPattern.isImageInUse, {
                            publicId: image.public_id,
                        })
                        .pipe(),
                ),
            ]);
            if (inUseArray.some((inUse) => inUse === true)) {
                this.logger.warn(`Image in use:: '${image.public_id}'`);
            } else {
                await this.cloudinaryService.deleteFile(image.public_id).then(() => {
                    this.logger.debug(`Deleted:: '${image.public_id}'`);
                });
            }
        }

        // Continue remove unused image if next_cursor is not null
        if (images?.next_cursor) {
            if (images?.rate_limit_remaining && images.rate_limit_remaining < RESULT_PER_REQUEST) {
                const resetAt = images?.rate_limit_reset_at
                    ? new Date(+images.rate_limit_reset_at * 1000)
                    : new Date();
                this.logger.info(`Rate limit exceeded. Reset at ${resetAt}`);

                // Wait until rate limit has been reset
                const now = new Date();
                const timeToReset = resetAt.getTime() - now.getTime();
                await new Promise((resolve) => setTimeout(resolve, timeToReset));

                this.logger.info('Rate limit has been reset. Continuing remove unused image');
                await this.removeUnusedImage(images?.next_cursor);
            } else {
                this.logger.info('Waiting for 30 minutes before continuing');
                await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 30));
                this.logger.info('Continue remove unused image');
                await this.removeUnusedImage(images?.next_cursor);
            }
        } else {
            this.logger.info('Finish remove unused image');
        }
    }
}
