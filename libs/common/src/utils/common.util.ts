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

/**
 *
 * @param length The length of the random string
 * @param typeOfStr The type of the random string
 * @returns The random string generated
 */
export function generateRandomString(
    length: number,
    typeOfStr: 'numeric' | 'alphabet' | 'alphabetLower' | 'alphabetUpper' | 'both' = 'both',
) {
    let result = '';
    let characters = '';

    switch (typeOfStr) {
        case 'numeric':
            characters = '0123456789';
            break;
        case 'alphabet':
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            break;
        case 'alphabetLower':
            characters = 'abcdefghijklmnopqrstuvwxyz';
            break;
        case 'alphabetUpper':
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            break;
        case 'both':
        default:
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            break;
    }

    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += `${characters[(Math.random() * charactersLength) | 0]}`;
    }
    return result;
}
