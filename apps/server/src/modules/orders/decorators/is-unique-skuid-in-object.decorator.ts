import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { ProductInOrderDto } from '~/server/orders/dtos';

@ValidatorConstraint({ async: false })
export class IsUniqueSkuIdInObject implements ValidatorConstraintInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validate(values: ProductInOrderDto[], args: ValidationArguments) {
        const skuIds = values.map((v) => v.skuId);
        const uniqueSkuIds = [...new Set(skuIds)];
        return uniqueSkuIds.length === skuIds.length;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} has duplicate values`;
    }
}
