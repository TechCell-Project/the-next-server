import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '~/modules/users/enums';
import { Roles } from '../decorators/role.decorator';
import { RolesGuard } from './role.guard';

export function AuthRoles(...roles: UserRole[]) {
    return applyDecorators(Roles(...roles), UseGuards(AuthGuard('jwt'), RolesGuard));
}
