import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand } from './schemas/brands.schema';
import { Seeder, DataFactory } from 'nestjs-seeder';

@Injectable()
export class BrandsSeeder implements Seeder {
    constructor(@InjectModel(Brand.name) private readonly brand: Model<Brand>) {}

    async seed(): Promise<any> {
        // Generate 100 brands.
        const brands = DataFactory.createForClass(Brand).generate(100);

        // Assign an ID to each. Avoiding duplicates.
        brands.forEach((u) => {
            return Object.assign(u, { _id: new Types.ObjectId() });
        });

        // Insert into the database.
        return this.brand.insertMany(brands);
    }

    async drop(): Promise<any> {
        return this.brand.deleteMany({});
    }
}
