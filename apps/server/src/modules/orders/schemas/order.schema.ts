import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '~/common/abstract';
import { Factory } from 'nestjs-seeder';
import { Faker } from '@faker-js/faker';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerSchema } from './customer.schema';
import { PaymentSchema } from './payment.schema';
import { OrderStatusEnum } from '../enum';
import { ProductSchema } from './product.schema';
import { ShippingSchema } from './shipping.schema';

@Schema({
    timestamps: true,
    collection: 'orders',
})
export class Order extends AbstractDocument {
    constructor(data?: Partial<Order>) {
        super();
        Object.assign(this, data);

        this.totalPrice =
            0 +
            (this?.shipping?.fee ?? 0) +
            this.products.reduce((total: number, product) => {
                return (
                    total +
                    (product?.unitPrice?.special || product.unitPrice.base) * product.quantity
                );
            }, 0);
    }

    @ApiProperty({ type: CustomerSchema })
    @Factory(() => {})
    @Prop({ required: true, type: CustomerSchema })
    customer: CustomerSchema;

    @ApiPropertyOptional({ example: 'wait at 123 street', type: String })
    @Factory((faker: Faker) => faker.company.catchPhrase())
    @Prop({ required: false, type: String, default: '' })
    note: string;

    @ApiProperty({ type: [ProductSchema] })
    @Factory(() => [])
    @Prop({ required: true, type: [ProductSchema] })
    products: ProductSchema[];

    @ApiProperty({ type: PaymentSchema })
    @Prop({ required: true, type: PaymentSchema })
    payment: PaymentSchema;

    @ApiProperty({ example: OrderStatusEnum.Pending, enum: OrderStatusEnum, type: String })
    @Factory((faker: Faker) => faker.helpers.enumValue(OrderStatusEnum))
    @Prop({ required: true, type: String, enum: OrderStatusEnum })
    orderStatus: string;

    @ApiProperty({ type: ShippingSchema })
    @Factory(() => {})
    @Prop({ required: false, type: ShippingSchema })
    shipping?: ShippingSchema;

    @ApiProperty({ example: 10000, type: Number, description: 'Total price of order' })
    @Prop({ required: true, type: Number })
    totalPrice: number;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
