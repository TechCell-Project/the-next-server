import { PartialType, PickType } from '@nestjs/swagger';
import { CreateSkuDto } from './create-sku.dto';

export class UpdateSkuDto extends PartialType(
    PickType(CreateSkuDto, ['name', 'description', 'imagePublicId', 'price', 'tags', 'status']),
) {}
