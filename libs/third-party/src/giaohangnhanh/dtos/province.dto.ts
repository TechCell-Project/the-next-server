import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { GhnStatusEnum } from '../enums';
import { ApiProperty } from '@nestjs/swagger';
import { GhnProvince } from 'giaohangnhanh/lib/address';

export class GhnProvinceDTO {
    constructor(data: GhnProvince) {
        this.provinceId = Number(data.ProvinceID);
        this.provinceName = data.ProvinceName;
        this.countryId = Number(data.CountryID);
        this.nameExtension = data.NameExtension;
        this.status = Number(data.Status);
    }

    @ApiProperty({
        example: 201,
        description: 'Mã tỉnh thành',
        type: Number,
    })
    @IsNumber()
    @IsNotEmpty()
    provinceId: number;

    @ApiProperty({
        example: 'Hà Nội',
        description: 'Tên tỉnh thành',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    provinceName: string;

    @ApiProperty({
        example: 1,
        description: 'Mã quốc gia',
        type: Number,
    })
    @IsNumber()
    @IsNotEmpty()
    countryId: number;

    @ApiProperty({
        example: [
            'Hà Nội',
            'TP.Hà Nội',
            'TP. Hà Nội',
            'TP Hà Nội',
            'Thành phố Hà Nội',
            'hanoi',
            'HN',
            'ha noi',
        ],
        description: 'Tên tỉnh thành mở rộng',
        type: [String],
    })
    @IsArray()
    nameExtension: string[];

    @ApiProperty({
        example: 1,
        description: 'Trạng thái',
        type: Number,
        enum: GhnStatusEnum,
    })
    @IsEnum(GhnStatusEnum)
    status: number;
}
