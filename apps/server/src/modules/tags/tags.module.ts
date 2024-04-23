import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '~/common/database/mongodb';
import { Tag, TagSchema } from './schemas';
import { Module } from '@nestjs/common';
import { TagRepository } from './tags.repository';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
    imports: [MongodbModule, MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }])],
    controllers: [TagsController],
    providers: [TagRepository, TagsService],
    exports: [TagsService],
})
export class TagsModule {}
