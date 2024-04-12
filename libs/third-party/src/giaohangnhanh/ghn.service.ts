import { Inject, Injectable } from '@nestjs/common';
import { GetShippingFeeDTO, ItemShipping } from './dtos/get-shipping-fee.dto';
import Ghn, { GhnConfig } from 'giaohangnhanh';
import { GhnDistrictDTO, GhnProvinceDTO, GhnWardDTO } from './dtos';
import { UserAddressSchema } from '~/server/users';
import { RedisService } from '~/common/redis';
import { convertTimeString } from 'convert-time-string';

@Injectable()
export class GhnService {
    private readonly ghnInstance: Ghn;

    constructor(
        @Inject('GHN_INIT_OPTIONS') private readonly config: GhnConfig,
        private readonly redisService: RedisService,
    ) {
        this.ghnInstance = new Ghn(this.config);
    }

    public async getProvinces() {
        const cacheKey = 'CACHE_ghn_get_provinces';
        const fromCache = await this.redisService.get<GhnProvinceDTO[]>(cacheKey);

        if (fromCache) {
            return fromCache;
        }

        const provinces = (await this.ghnInstance.address.getProvinces()).map(
            (p) => new GhnProvinceDTO(p),
        );
        await this.redisService.set(cacheKey, provinces, convertTimeString('4h'));
        return provinces;
    }

    public async getDistricts(provinceId: number) {
        const cacheKey = `CACHE_ghn_get_districts_${provinceId}`;
        const fromCache = await this.redisService.get<GhnDistrictDTO[]>(cacheKey);

        if (fromCache) {
            return fromCache;
        }

        const districts = (await this.ghnInstance.address.getDistricts(provinceId)).map(
            (d) => new GhnDistrictDTO(d),
        );
        await this.redisService.set(cacheKey, districts, convertTimeString('4h'));

        return districts;
    }

    public async getWards(districtId: number) {
        const cacheKey = `CACHE_ghn_get_wards_${districtId}`;
        const fromCache = await this.redisService.get<GhnWardDTO[]>(cacheKey);

        if (fromCache) {
            return fromCache;
        }

        const wards = (await this.ghnInstance.address.getWards(districtId)).map(
            (w) => new GhnWardDTO(w),
        );
        await this.redisService.set(cacheKey, wards, convertTimeString('4h'));

        return wards;
    }

    public async calculateShippingFee({
        address,
        items,
    }: {
        address: UserAddressSchema;
        items: ItemShipping[];
    }) {
        const { selectedDistrict, selectedWard } = await this.getSelectedAddress(address);

        const integerItems = items.map((item) => ({
            ...item,
            weight: Math.ceil(item.weight),
            height: Math.ceil(item.height / 10),
            length: Math.ceil(item.length / 10),
            width: Math.ceil(item.width / 10),
            quantity: Math.ceil(item.quantity),
        }));
        const [weight, height, length, width] = integerItems.reduce(
            (acc, item) => {
                return [
                    acc[0] + item.weight * item.quantity,
                    acc[1] + item.height * item.quantity,
                    acc[2] + item.length * item.quantity,
                    acc[3] + item.width * item.quantity,
                ];
            },
            [0, 0, 0, 0],
        );

        const dataFee = new GetShippingFeeDTO({
            service_type_id: 2,
            to_district_id: selectedDistrict.districtId,
            to_ward_code: selectedWard.wardCode,
            items: integerItems,
            province_id: selectedDistrict.provinceId,
            weight,
            height,
            length,
            width,
        });

        const fee = await this.ghnInstance.calculateFee
            .calculateShippingFee(dataFee)
            .catch((error) => {
                throw error;
            });

        return fee;
    }

    // Utils
    public async getSelectedAddress(address: UserAddressSchema) {
        const provinceData = await this.getProvinces().catch((error) => {
            throw error;
        });
        const selectedProvince = provinceData.find(
            (province) => province.provinceId === address.provinceLevel.provinceId,
        );
        if (!selectedProvince) {
            throw new Error(`Province not found: ${address.provinceLevel.provinceId}`);
        }

        const districtData = await this.getDistricts(selectedProvince.provinceId).catch((error) => {
            throw error;
        });
        const selectedDistrict = districtData.find(
            (district) => district.districtId === address.districtLevel.districtId,
        );

        if (!selectedDistrict) {
            throw new Error(`District not found: ${address.districtLevel.districtId}`);
        }

        const wardData = await this.getWards(selectedDistrict.districtId).catch((error) => {
            throw error;
        });

        const selectedWard = wardData.find((ward) => ward.wardCode === address.wardLevel.wardCode);
        if (!selectedWard) {
            throw new Error(`Ward not found: ${address.wardLevel.wardCode}`);
        }

        return { selectedProvince, selectedDistrict, selectedWard };
    }
}
