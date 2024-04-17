import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { GhnModule } from '~/third-party/giaohangnhanh';

@Module({
    imports: [
        GhnModule.forRoot({
            host: process.env.GHN_URL!,
            token: process.env.GHN_API_TOKEN!,
            shopId: +process.env.GHN_SHOP_ID!,
            testMode: true,
        }),
    ],
    controllers: [AddressController],
    providers: [AddressService],
})
export class AddressModule {}
