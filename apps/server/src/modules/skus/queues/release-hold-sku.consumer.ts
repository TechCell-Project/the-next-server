import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { RELEASE_HOLD_SERIAL_NUMBER_QUEUE } from '../constants/skus-queue.constant';
import { PinoLogger } from 'nestjs-pino';
import { Job } from 'bullmq';
import { SkusService } from '../skus.service';

@Injectable()
@Processor(RELEASE_HOLD_SERIAL_NUMBER_QUEUE, {
    // The concurrency option specifies how many jobs this processor can handle concurrently.
    // In this case, it can handle up to 100 jobs at the same time.
    concurrency: 50,
    // The limiter option is used to rate limit the job processing.
    // In this case, the processor can handle a maximum of 100 jobs per 10,000 milliseconds (or 10 seconds).
    limiter: {
        max: 200,
        duration: 5000,
    },
})
export class ReleaseHoldSerialNumberConsumer extends WorkerHost {
    constructor(
        private readonly logger: PinoLogger,
        private readonly skusService: SkusService,
    ) {
        super();
    }

    async process(job: Job<{ serialNumber: string }>) {
        try {
            await this.skusService.releaseHoldSerialNumber(job.data.serialNumber);
        } catch (error) {
            this.logger.error(error);
        }
    }
}
