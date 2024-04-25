import { Prop } from '@nestjs/mongoose';
import { UserAddressTypeEnum } from '../enums';
import { ApiProperty } from '@nestjs/swagger';

export class ProvinceLevel {
    @ApiProperty({ type: Number, example: 201 })
    @Prop({ required: true, type: Number })
    provinceId: number;

    @ApiProperty({ type: String, example: 'Ha Noi' })
    @Prop({ required: true, type: String })
    provinceName: string;
}

export class DistrictLevel {
    @ApiProperty({ type: Number, example: 1490 })
    @Prop({ required: true, type: Number })
    districtId: number;

    @ApiProperty({ type: String, example: 'Quan Hoang Mai' })
    @Prop({ required: true, type: String })
    districtName: string;
}

export class WardLevel {
    @ApiProperty({ type: String, example: '1A0814' })
    @Prop({ required: true, type: String })
    wardCode: string;

    @ApiProperty({ type: String, example: 'Mai Dong' })
    @Prop({ required: true, type: String })
    wardName: string;
}

export class UserAddressSchema {
    constructor(address: Partial<UserAddressSchema>) {
        Object.assign(this, address);
    }

    @ApiProperty({ type: ProvinceLevel })
    @Prop({ required: true, type: ProvinceLevel })
    provinceLevel: ProvinceLevel;

    @ApiProperty({ type: DistrictLevel })
    @Prop({ required: true, type: DistrictLevel })
    districtLevel: DistrictLevel;

    @ApiProperty({ type: WardLevel })
    @Prop({ required: true, type: WardLevel })
    wardLevel: WardLevel;

    @ApiProperty({ type: String, example: '18 Tam Trinh' })
    @Prop({ required: true, type: String })
    detail: string;

    @ApiProperty({ type: Boolean, example: false })
    @Prop({ default: false, type: Boolean })
    isDefault: boolean;

    @ApiProperty({ type: String, example: 'John Doe' })
    @Prop({ required: true, type: String })
    customerName: string;

    @ApiProperty({
        description: 'The phone number of customer',
        example: '0123456789',
        type: String,
    })
    @Prop({ required: true, type: String })
    phoneNumbers: string;

    @ApiProperty({ type: String, default: UserAddressTypeEnum.Other })
    @Prop({ type: String, default: UserAddressTypeEnum.Other })
    type: string;
}
