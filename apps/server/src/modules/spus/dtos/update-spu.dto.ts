import { PartialType, PickType } from '@nestjs/swagger';
import { CreateSpuDto } from './create-spu.dto';

export class UpdateSpuDto extends PartialType(
    PickType(CreateSpuDto, ['commonAttributes', 'description', 'name']),
) {}
