import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CloudinaryModule } from '~/third-party';

@Module({
    imports: [CloudinaryModule],
    controllers: [ImagesController],
    providers: [ImagesService],
    exports: [ImagesService],
})
export class ImagesModule {}
