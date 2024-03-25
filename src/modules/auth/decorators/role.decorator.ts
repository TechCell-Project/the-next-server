import { SetMetadata } from '@nestjs/common';
import { UserRole } from '~/modules/users/enums';

export const Roles = (...roles: UserRole[]) => SetMetadata(Roles.name, roles);
