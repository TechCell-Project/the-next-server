import { IsEnum } from 'class-validator';
import { GhnSupportTypeEnum, GhnStatusEnum } from '../enums';
import { ApiProperty } from '@nestjs/swagger';
import { GhnDistrict } from 'giaohangnhanh/lib/address';

export class GhnDistrictDTO {
    constructor(data: GhnDistrict) {
        this.districtId = Number(data.DistrictID);
        this.districtName = data.DistrictName;
        this.supportType = Number(data.SupportType);
        this.nameExtension = data.NameExtension;
        this.canUpdateCod = Boolean(data.CanUpdateCOD);
        this.status = Number(data.Status);
    }

    @ApiProperty({
        example: 201,
        description: 'Mã tỉnh thành',
        type: Number,
    })
    provinceId: number;

    @ApiProperty({
        example: 1490,
        description: 'Mã quận huyện',
        type: Number,
    })
    districtId: number;

    @ApiProperty({
        example: 'Quận Hoàng Mai',
        description: 'Tên quận huyện',
        type: String,
    })
    districtName: string;

    @ApiProperty({
        example: 1,
        description: 'Loại hỗ trợ',
        type: Number,
        enum: GhnSupportTypeEnum,
    })
    @IsEnum(GhnSupportTypeEnum)
    supportType: number;

    @ApiProperty({
        example: [
            'Quận Hoàng Mai',
            'Q.Hoàng Mai',
            'Q Hoàng Mai',
            'Hoàng Mai',
            'Hoang Mai',
            'Quan Hoang Mai',
            'hoangmai',
        ],
        description: 'Tên quận huyện mở rộng',
        type: [String],
    })
    nameExtension: string[];

    @ApiProperty({
        example: true,
        description: 'Có thể cập nhật COD',
        type: Boolean,
    })
    canUpdateCod: boolean;

    @ApiProperty({
        example: 1,
        description: 'Trạng thái',
        type: Number,
        enum: GhnStatusEnum,
    })
    @IsEnum(GhnStatusEnum)
    @ApiProperty({
        example: 1,
        description: 'Trạng thái',
        type: Number,
        enum: GhnStatusEnum,
    })
    status: number;
}
