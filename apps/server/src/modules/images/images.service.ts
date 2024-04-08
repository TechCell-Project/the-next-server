import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ImageUploadedResponseDTO } from './dtos/image-uploaded-response.dto';
import { CloudinaryService } from '~/third-party/cloudinary.com';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ImagesService {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(ImagesService.name);
    }

    async getImages() {
        try {
            const images = await this.cloudinaryService.getImagesInFolder({
                next_cursor: undefined,
            });
            return {
                images,
            };
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Get images failed, please try again later');
        }
    }

    async getImageByPublicId(publicId: string) {
        try {
            const image = await this.cloudinaryService.getImageByPublicId(publicId);
            return new ImageUploadedResponseDTO(image);
        } catch (error) {
            this.logger.error(error);
            if (error.http_code === 404) {
                throw new NotFoundException(`Image with publicId ${publicId} not found`);
            }
            throw new InternalServerErrorException('Get images failed, please try again later');
        }
    }

    private async uploadSingleImage(image: Express.Multer.File) {
        try {
            const uploadedImage = await this.cloudinaryService.uploadImage(image);
            return new ImageUploadedResponseDTO(uploadedImage);
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(`Upload images failed, please try again later`);
        }
    }

    async uploadArrayImage({ images }: { images: Express.Multer.File[] }) {
        const uploadedFilenames = new Set();

        const uploadedImages = await Promise.all(
            images.map(async (image) => {
                if (!uploadedFilenames.has(image.filename)) {
                    const uploadedImage = await this.uploadSingleImage(image);
                    uploadedFilenames.add(image.filename);
                    return uploadedImage;
                }
            }),
        );

        return {
            data: uploadedImages.filter(Boolean), // filter out undefined values
        };
    }
}
