import { Prop } from '@nestjs/mongoose';
import { AddressType } from '../enums';
import { ApiProperty } from '@nestjs/swagger';

class ProvinceLevel {
    @ApiProperty({ type: Number, example: 201 })
    @Prop({ required: true, type: Number })
    provinceId: number;
}

class DistrictLevel {
    @ApiProperty({ type: Number, example: 1490 })
    @Prop({ required: true, type: Number })
    districtId: number;
}

class WardLevel {
    @ApiProperty({ type: String, example: '1A0814' })
    @Prop({ required: true, type: String })
    wardCode: string;
}

export class UserAddressSchema {
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

    @ApiProperty({ type: String, enum: AddressType, default: AddressType.Other })
    @Prop({ type: String, enum: AddressType, default: AddressType.Other })
    type: string;
}
