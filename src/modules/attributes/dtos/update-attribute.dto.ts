import { PickType } from '@nestjs/swagger';
import { Attribute } from '../schemas';

export class UpdateAttributeDto extends PickType(Attribute, ['status', 'name', 'description']) {}
