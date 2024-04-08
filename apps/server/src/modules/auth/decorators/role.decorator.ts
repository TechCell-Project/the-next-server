import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '~/server/users/enums';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata(Roles.name, roles);
