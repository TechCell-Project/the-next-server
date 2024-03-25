export function keysOfEnum<T extends object>(enumObj: T): string[] {
    const keys = Object.keys(enumObj).filter((k) => isNaN(Number(k)));
    return keys;
}

export function valuesOfEnum<T extends object>(enumObj: T): (string | number)[] {
    const values = keysOfEnum(enumObj).map(
        (k) => enumObj[k as keyof T] as unknown as string | number,
    );

    return values;
}
