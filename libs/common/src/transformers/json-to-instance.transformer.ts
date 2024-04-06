import { BadRequestException } from '@nestjs/common';
import { Transform, plainToInstance } from 'class-transformer';

export function JsonTransform<T>(classType: new () => T): (target: unknown, key: string) => void {
    return Transform(({ value }) => {
        try {
            return value ? plainToInstance(classType, JSON.parse(value)) : undefined;
        } catch (error) {
            throw new BadRequestException(`Invalid JSON format for ${classType.name}`);
        }
    });
}
