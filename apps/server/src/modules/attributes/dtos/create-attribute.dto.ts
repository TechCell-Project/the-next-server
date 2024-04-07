import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsLowercase, Matches, IsOptional } from 'class-validator';

export class CreateAttributeDto {
    @ApiProperty({
        example: 'ram',
        description:
            'Attribute label. Label must only contain lowercase letters and optional underscores',
    })
    @IsString()
    @IsNotEmpty()
    @IsLowercase()
    @Matches(/^[a-z_]*[a-z][a-z_]*$/, {
        message: 'Label must only contain lowercase letters and optional underscores',
    })
    label: string;

    @ApiProperty({ example: 'RAM', description: 'Attribute name, can be in any language' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'GB', description: 'Unit abbreviation for this attribute' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({
        example: 'Product RAM information',
        description: 'Attribute description',
    })
    @IsOptional()
    @IsString()
    description: string;
}
