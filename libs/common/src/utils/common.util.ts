import { Types, isValidObjectId } from 'mongoose';

export function convertToObjectId(
    input: string | Types.ObjectId | Uint8Array | number,
): Types.ObjectId {
    if (!isValidObjectId(input)) {
        throw new Error('Invalid object id');
    }
    return new Types.ObjectId(input);
}
