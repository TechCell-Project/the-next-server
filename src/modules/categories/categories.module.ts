import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Category, CategorySchema } from './schemas';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongodbModule,
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class CategoriesModule {}
