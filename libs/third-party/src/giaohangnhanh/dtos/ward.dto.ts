import { IsEnum } from 'class-validator';
import { GhnStatusEnum, GhnSupportTypeEnum } from '../enums';
import { ApiProperty } from '@nestjs/swagger';
import { GhnWard } from 'giaohangnhanh/lib/address';

export class GhnWardDTO {
    constructor(data: GhnWard) {
        this.districtId = Number(data.DistrictID);
        this.wardCode = data.WardCode;
        this.wardName = data.WardName;
        this.supportType = Number(data.SupportType);
        this.nameExtension = data.NameExtension;
        this.canUpdateCod = Boolean(data.CanUpdateCOD);
        this.status = Number(data.Status);
    }

    @ApiProperty({
        type: Number,
        example: 1490,
        description: 'Mã quận huyện',
    })
    districtId: number;

    @ApiProperty({
        type: String,
        example: '1A0807',
        description: 'Mã phường xã',
    })
    wardCode: string;

    @ApiProperty({
        type: String,
        example: 'Phường Mai Động',
        description: 'Tên phường xã',
    })
    wardName: string;

    @ApiProperty({
        type: [String],
        description: 'Tên phường xã mở rộng',
        example: [
            'Phường Mai Động',
            'P.Mai Động',
            'P Mai Động',
            'Mai Động',
            'Mai Dong',
            'Phuong Mai Dong',
            'maidong',
        ],
    })
    nameExtension: string[];

    @ApiProperty({
        type: Number,
        example: 1,
        description: 'Loại hỗ trợ',
        enum: GhnSupportTypeEnum,
    })
    @IsEnum(GhnSupportTypeEnum)
    supportType: number;

    @ApiProperty({
        type: Boolean,
        example: true,
        description: 'Có thể cập nhật COD',
    })
    canUpdateCod: boolean;

    @ApiProperty({
        type: Number,
        example: 1,
        description: 'Trạng thái',
        enum: GhnStatusEnum,
    })
    @IsEnum(GhnStatusEnum)
    status: number;
}
