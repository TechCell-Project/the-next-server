import { PartialType, PickType } from '@nestjs/swagger';
import { CreateSpuDto, SPUModelSchemaDto } from './create-spu.dto';

export class AddSpuModelDto extends PickType(CreateSpuDto, ['models']) {}

export class UpdateSPUModelSchemaDto extends PartialType(
    PickType(SPUModelSchemaDto, ['name', 'description', 'attributes', 'images']),
) {}
