import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
    DistrictLevel,
    ProvinceLevel,
    User,
    UserAddressSchema,
    WardLevel,
} from '~/server/users/schemas';

class UserProvinceResponseDto extends IntersectionType(ProvinceLevel) {
    @ApiProperty({ type: String, example: 'Ha Noi' })
    provinceName: string;
}

class UserDistrictResponseDto extends IntersectionType(DistrictLevel) {
    @ApiProperty({ type: String, example: 'Quan Hoang Mai' })
    districtName: string;
}

class UserWardResponseDto extends IntersectionType(WardLevel) {
    @ApiProperty({ type: String, example: 'Mai Dong' })
    wardName: string;
}

class UserAddressResponseDto extends IntersectionType(UserAddressSchema) {
    @ApiProperty({ type: UserProvinceResponseDto })
    provinceLevel: UserProvinceResponseDto;

    @ApiProperty({ type: UserDistrictResponseDto })
    districtLevel: UserDistrictResponseDto;

    @ApiProperty({ type: UserWardResponseDto })
    wardLevel: UserWardResponseDto;
}

export class GetMeResponseDto extends IntersectionType(User) {
    constructor(data: GetMeResponseDto) {
        super();
        Object.assign(this, data);
    }
    @ApiProperty({ type: String })
    _id: Types.ObjectId;

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiProperty({ type: Date })
    updatedAt: Date;

    @ApiProperty({ type: UserAddressResponseDto, isArray: true })
    address?: UserAddressResponseDto[];
}
