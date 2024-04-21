import { HttpException, HttpStatus } from '@nestjs/common';

export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries: number;
        errorMessage?: string;
        delay?: number;
    },
): Promise<T> {
    let retries = 0;
    const maxRetries = options?.maxRetries || 2;
    let delay = options?.delay || 500;
    const errorMessage = options?.errorMessage || 'Failed after multiple attempts';

    while (retries < maxRetries) {
        try {
            const res = await fn();
            return res;
        } catch (error) {
            retries++;
            console.error(error);
            if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= retries; // Increase delay
            } else {
                throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
}
