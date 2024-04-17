import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
    GhnDistrictDTO,
    GhnProvinceDTO,
    GhnService,
    GhnWardDTO,
} from '~/third-party/giaohangnhanh';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AddressService {
    constructor(
        private readonly ghnService: GhnService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(AddressService.name);
    }

    async getProvinces(): Promise<GhnProvinceDTO[]> {
        try {
            const listProvince = await this.ghnService.getProvinces();
            if (!listProvince) {
                throw new NotFoundException('Provinces not found');
            }

            return listProvince;
        } catch (error) {
            this.logger.error(error);
            throw new BadRequestException('Provinces not found');
        }
    }

    async getDistricts(provinceId: number): Promise<GhnDistrictDTO[]> {
        if (!provinceId || provinceId === undefined || provinceId === null) {
            throw new BadRequestException('ProvinceId is required');
        }

        try {
            const listDistrict = await this.ghnService.getDistricts(provinceId);
            return listDistrict;
        } catch (error) {
            this.logger.error(error);
            throw new NotFoundException('Districts not found');
        }
    }

    async getWards(districtId: number): Promise<GhnWardDTO[]> {
        if (!districtId || districtId === undefined || districtId === null) {
            throw new BadRequestException('DistrictId is required');
        }

        try {
            const listWard = await this.ghnService.getWards(districtId);
            if (!listWard) {
                throw new NotFoundException('Wards not found. Please check your districtId');
            }
            return listWard;
        } catch (error) {
            this.logger.error(error);
            throw new NotFoundException('Wards not found. Please check your districtId');
        }
    }
}
