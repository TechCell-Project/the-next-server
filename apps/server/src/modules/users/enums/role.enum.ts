import { valuesOfEnum } from '~/common';

export enum UserRoleEnum {
    Manager = 'manager',
    Customer = 'customer',
    Sales = 'sales',
    Warehouse = 'warehouse',
}

export const RolesWithoutCustomerAndManager = valuesOfEnum(UserRoleEnum).filter(
    (role) => role !== UserRoleEnum.Customer && role !== UserRoleEnum.Manager,
);
export type RolesWithoutCustomerAndManager = (typeof RolesWithoutCustomerAndManager)[number];
