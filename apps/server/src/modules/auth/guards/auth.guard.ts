import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleEnum } from '~/modules/users/enums';
import { Roles } from '../decorators/role.decorator';
import { RolesGuard } from './role.guard';

export function AuthRoles(...roles: UserRoleEnum[]) {
    return applyDecorators(Roles(...roles), UseGuards(AuthGuard('jwt'), RolesGuard));
}
