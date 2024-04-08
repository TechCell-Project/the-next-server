import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '~/modules/users/enums';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(Roles.name, roles);
