import { Controller, Get, Param } from '@nestjs/common';
import { AddressService } from './address.service';
import { QueryDistrictsDTO, QueryWardsDTO } from './dtos';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GhnDistrictDTO, GhnProvinceDTO, GhnWardDTO } from '~/third-party/giaohangnhanh';

@ApiTags('address')
@Controller({
    path: 'address',
})
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @ApiOperation({ summary: 'Get provinces' })
    @ApiOkResponse({ description: 'Lấy danh sách tỉnh thành công.', type: [GhnProvinceDTO] })
    @Get('provinces')
    async getProvinces() {
        return this.addressService.getProvinces();
    }

    @ApiOperation({ summary: 'Get districts' })
    @ApiOkResponse({ description: 'Lấy danh sách quận/huyện thành công.', type: [GhnDistrictDTO] })
    @Get('districts/:province_id')
    async getDistricts(@Param() { province_id }: QueryDistrictsDTO) {
        return this.addressService.getDistricts(province_id);
    }

    @ApiOperation({ summary: 'Get wards' })
    @ApiOkResponse({ description: 'Lấy danh sách phường/xã thành công.', type: [GhnWardDTO] })
    @Get('wards/:district_id')
    async getWards(@Param() { district_id }: QueryWardsDTO) {
        return this.addressService.getWards(district_id);
    }
}
