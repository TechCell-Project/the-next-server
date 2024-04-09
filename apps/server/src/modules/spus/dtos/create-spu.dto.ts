import { SPU } from '../schemas';
import {
    IsBoolean,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeInProductSchema } from '../schemas/spu-attribute.schema';
import { SPUModelSchema } from '../schemas/spu-model.schema';
import { ImageSchema } from '../schemas/spu-image.schema';
import { Transform, Type } from 'class-transformer';
import { isTrueSet } from '~/common';

class ImageSchemaDto implements Omit<ImageSchema, 'url'> {
    @ApiProperty({ example: '5f9a7f5d9d8f6d7f5d8f6d7', type: String })
    @IsString()
    @IsNotEmpty()
    publicId: string;

    @ApiProperty({ example: true, type: Boolean })
    @Transform(({ value }) => isTrueSet(value))
    @IsBoolean()
    isThumbnail: boolean;
}

class AttributeInProductSchemaDto implements AttributeInProductSchema {
    @ApiProperty({ example: 'RAM', type: String })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'ram', type: String })
    @IsString()
    @IsNotEmpty()
    k: string;

    @ApiProperty({ example: '8', type: String })
    @IsString()
    @IsNotEmpty()
    v: string;

    @ApiPropertyOptional({ example: 'GB', type: String })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    u: string;
}

class SPUModelSchemaDto implements Omit<SPUModelSchema, 'images'> {
    @ApiProperty({ example: 'plus', type: String })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({ example: 'iPhone 15 Plus', type: String })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'This is iPhone 15 Plus model', type: String })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({ type: [ImageSchemaDto] })
    @ValidateNested({ each: true })
    @Type(() => ImageSchemaDto)
    images: ImageSchemaDto[];

    @ApiProperty({
        type: [AttributeInProductSchemaDto],
        description: 'Model attributes',
    })
    @ValidateNested({ each: true })
    @Type(() => AttributeInProductSchemaDto)
    attributes: AttributeInProductSchemaDto[];
}

export class CreateSpuDto implements Omit<SPU, '_id' | 'brandId' | 'models' | 'slug'> {
    @ApiProperty({
        example: '5f9a7f5d9d8f6d7f5d8f6d7',
        description: 'Brand id',
        type: String,
        format: 'ObjectId',
    })
    @IsString()
    @IsMongoId()
    brandId: string;

    @ApiProperty({
        example: 'iPhone 15 series',
        description: 'Spu name',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'This is iPhone 15 series',
        description: 'Spu description',
        type: String,
    })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({
        type: [AttributeInProductSchemaDto],
        description: 'Common attributes',
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => AttributeInProductSchemaDto)
    commonAttributes: AttributeInProductSchemaDto[];

    @ApiProperty({
        type: [SPUModelSchemaDto],
        description: 'Models',
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SPUModelSchemaDto)
    models: SPUModelSchemaDto[];
}
