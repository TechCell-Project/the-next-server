import { Prop } from '@nestjs/mongoose';
import { AddressType } from '../enums';

class ProvinceLevel {
    @Prop({ required: true, type: Number })
    provinceId: number;
}

class DistrictLevel {
    @Prop({ required: true, type: Number })
    districtId: number;
}

class WardLevel {
    @Prop({ required: true, type: String })
    wardCode: string;
}

export class UserAddressSchema {
    @Prop({ required: true, type: ProvinceLevel })
    provinceLevel: ProvinceLevel;

    @Prop({ required: true, type: DistrictLevel })
    districtLevel: DistrictLevel;

    @Prop({ required: true, type: WardLevel })
    wardLevel: WardLevel;

    @Prop({ default: false, type: Boolean })
    isDefault: boolean;

    @Prop({ required: true, type: String })
    customerName: string;

    @Prop({ type: String, enum: AddressType, default: AddressType.Other })
    type: string;

    @Prop({ required: true, type: String })
    detail: string;
}
