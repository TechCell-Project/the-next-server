import { Condition, ObjectId, Types, isValidObjectId } from 'mongoose';

export function convertToObjectId(
    input: string | Types.ObjectId | Uint8Array | number | Condition<ObjectId>,
): Types.ObjectId {
    if (!isValidObjectId(input)) {
        throw new Error('Invalid object id');
    }
    return new Types.ObjectId(input);
}

/**
 *
 * @param stringValue The string value to check if it is true
 * @returns true if the string value is true, otherwise false
 * @description true value: true
 */
export function isTrueSet(stringValue: string | boolean) {
    return !!stringValue && String(stringValue)?.toLowerCase()?.trim() === 'true';
}
