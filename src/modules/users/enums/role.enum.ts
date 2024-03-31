import { valuesOfEnum } from '~/common';

export enum UserRole {
    Manager = 'manager',
    Customer = 'customer',
    Sales = 'sales',
    Warehouse = 'warehouse',
    DataEntry = 'data_entry',
    Accountant = 'accountant',
}

export const RolesWithoutCustomerAndManager = valuesOfEnum(UserRole).filter(
    (role) => role !== UserRole.Customer && role !== UserRole.Manager,
);
export type RolesWithoutCustomerAndManager = (typeof RolesWithoutCustomerAndManager)[number];
