import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { convertTimeString } from 'convert-time-string';
import {
    GhnDistrictDTO,
    GhnProvinceDTO,
    GhnService,
    GhnWardDTO,
} from '~/third-party/giaohangnhanh';
import { RedisService } from '~/common/redis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AddressService {
    constructor(
        private readonly ghnService: GhnService,
        private redisService: RedisService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(AddressService.name);
    }

    private readonly GET_PROVINCES_CACHE_KEY = 'CACHE_address_get_provinces';
    private readonly GET_DISTRICTS_CACHE_KEY = 'CACHE_address_get_districts';
    private readonly GET_WARDS_CACHE_KEY = 'CACHE_address_get_wards';

    async getProvinces(): Promise<GhnProvinceDTO[]> {
        try {
            const listProvinceCache = await this.redisService.get<GhnProvinceDTO[]>(
                this.GET_PROVINCES_CACHE_KEY,
            );
            if (listProvinceCache) {
                return listProvinceCache;
            }

            const listProvince = await this.ghnService.getProvinces();
            if (!listProvince) {
                throw new NotFoundException('Provinces not found');
            }

            await this.setCache(this.GET_PROVINCES_CACHE_KEY, listProvince);
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
            const districtCacheKey = `${this.GET_DISTRICTS_CACHE_KEY}_${provinceId}`;
            const listDistrictCache =
                await this.redisService.get<GhnDistrictDTO[]>(districtCacheKey);
            if (listDistrictCache) {
                return listDistrictCache;
            }

            const listDistrict = await this.ghnService.getDistricts(provinceId);
            await this.setCache(districtCacheKey, listDistrict);
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
            const wardCacheKey = `${this.GET_WARDS_CACHE_KEY}_${districtId}`;
            const listWardCache = await this.redisService.get<GhnWardDTO[]>(wardCacheKey);
            if (listWardCache) {
                return listWardCache;
            }

            const listWard = await this.ghnService.getWards(districtId);
            if (!listWard) {
                throw new NotFoundException('Wards not found. Please check your districtId');
            }

            await this.setCache(wardCacheKey, listWard);
            return listWard;
        } catch (error) {
            this.logger.error(error);
            throw new NotFoundException('Wards not found. Please check your districtId');
        }
    }

    private async setCache(key: string, value: any, ttl?: number) {
        return this.redisService.set(key, value, ttl ?? convertTimeString('1h'));
    }
}
