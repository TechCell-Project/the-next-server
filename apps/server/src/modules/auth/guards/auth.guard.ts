import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleEnum } from '~/server/users/enums';
import { Roles } from '../decorators/role.decorator';
import { RolesGuard } from './role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export function AuthRoles(...roles: UserRoleEnum[]) {
    return applyDecorators(
        ApiBearerAuth(),
        Roles(...roles),
        UseGuards(AuthGuard('jwt'), RolesGuard),
    );
}
