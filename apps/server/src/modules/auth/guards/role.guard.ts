import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleEnum } from '~/server/users/enums';
import { Roles } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<UserRoleEnum[]>(Roles.name, [
            context.getClass(),
            context.getHandler(),
        ]);
        if (!roles?.length) {
            return true;
        }
        const request = context.switchToHttp().getRequest();

        return roles.includes(request.user?.role);
    }
}
