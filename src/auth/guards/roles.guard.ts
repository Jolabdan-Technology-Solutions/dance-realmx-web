import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    // Always allow ADMIN users
    if (
      (Array.isArray(user.role) &&
        user.role.map((r) => r.toUpperCase()).includes('ADMIN')) ||
      (!Array.isArray(user.role) && user.role.toUpperCase() === 'ADMIN')
    ) {
      return true;
    }

    // Handle both array and single role formats
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `You do not have the required role(s): ${requiredRoles.join(', ')}.`,
      );
    }
    return true;
  }
}
