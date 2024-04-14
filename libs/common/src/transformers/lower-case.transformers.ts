import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '../types/maybe.type';

export const lowerCaseTransformer = (params: TransformFnParams): MaybeType<string> => {
    try {
        return params.value?.toLowerCase().trim();
    } catch (error) {
        return params.value;
    }
};
