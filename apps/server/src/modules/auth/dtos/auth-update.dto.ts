import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { isTrueSet } from '~/common/utils';
import { UserAddressSchema } from '~/server/users';
import { UserAddressTypeEnum } from '~/server/users/enums';

class ProvinceSchemaDTO {
    @ApiProperty({ description: 'The id of province', example: 201, type: Number })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    provinceId: number;
}

class DistrictSchemaDTO {
    @ApiProperty({ description: 'The id of district', example: 1490, type: Number })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    districtId: number;
}

class WardSchemaDTO {
    @ApiProperty({ description: 'The code of ward', example: '1A0807', type: String })
    @IsNotEmpty()
    @IsString()
    wardCode: string;
}

export class UserAddressSchemaDTO implements UserAddressSchema {
    constructor(address: UserAddressSchemaDTO) {
        Object.assign(this, address);
    }

    @ApiProperty({
        description: 'The name type of address',
        enum: UserAddressTypeEnum,
        example: UserAddressTypeEnum.Home,
        type: String,
    })
    @IsEnum(UserAddressTypeEnum)
    @IsNotEmpty()
    type: string;

    @ApiProperty({ description: 'The name of customer', example: 'John Doe', type: String })
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @ApiProperty({
        description: 'The phone number of customer',
        example: '0123456789',
        type: String,
    })
    @IsPhoneNumber('VN')
    @IsNotEmpty()
    phoneNumbers: string;

    @ApiProperty({ description: 'The province level address', type: ProvinceSchemaDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => ProvinceSchemaDTO)
    provinceLevel: ProvinceSchemaDTO;

    @ApiProperty({ description: 'The district level address', type: DistrictSchemaDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => DistrictSchemaDTO)
    districtLevel: DistrictSchemaDTO;

    @ApiProperty({ description: 'The ward level address', type: WardSchemaDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => WardSchemaDTO)
    wardLevel: WardSchemaDTO;

    @ApiProperty({ description: 'The detailed address', example: '18 Tam Trinh', type: String })
    @IsString()
    @IsNotEmpty()
    detail: string;

    @ApiPropertyOptional({
        description: 'The boolean value to check if this address is default or not',
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => isTrueSet(value))
    isDefault: boolean;
}

export class AuthUpdateDto {
    @ApiPropertyOptional({ example: 'John', type: String })
    @IsOptional()
    @IsNotEmpty({ message: 'mustBeNotEmpty' })
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe', type: String })
    @IsOptional()
    @IsNotEmpty({ message: 'mustBeNotEmpty' })
    lastName?: string;

    @ApiPropertyOptional({
        example: 'password-will-secret',
        type: String,
        minLength: 6,
    })
    @IsOptional()
    @IsNotEmpty()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({
        example: 'password-will-secret',
        type: String,
        minLength: 6,
    })
    @IsOptional()
    @IsNotEmpty({ message: 'mustBeNotEmpty' })
    oldPassword?: string;

    @ApiPropertyOptional({ type: [UserAddressSchemaDTO] })
    @IsOptional()
    @Type(() => UserAddressSchemaDTO)
    address?: UserAddressSchemaDTO[];

    @ApiPropertyOptional({ example: 'public-id-image', type: String })
    @IsOptional()
    @IsNotEmpty({ message: 'mustBeNotEmpty' })
    avatarImageId?: string;
}
