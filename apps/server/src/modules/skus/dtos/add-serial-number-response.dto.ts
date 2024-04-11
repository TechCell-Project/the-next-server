import { ApiPropertyOptional } from '@nestjs/swagger';

class Errors {
    @ApiPropertyOptional({
        type: String,
        isArray: true,
        description: 'List of exist sold serial numbers',
        example: ['S000432151411', 'S000432151412'],
    })
    existSold?: string[];

    @ApiPropertyOptional({
        type: String,
        isArray: true,
        description: 'List of exist available serial numbers',
        example: ['AAA00432151411', 'AAA00432151412'],
    })
    existAvailable?: string[];
}

export class AddSerialNumberResponseDto {
    @ApiPropertyOptional({
        type: Errors,
    })
    errors: Errors;
}
