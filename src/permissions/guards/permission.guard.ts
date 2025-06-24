import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleHierarchyService } from '../role-hierarchy.service';
import { UserRole } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleHierarchy: RoleHierarchyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    // Get all permissions for the user's role
    const userPermissions = this.roleHierarchy.getAllPermissions(user.role);

    // Check if user has all required permissions
    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        throw new ForbiddenException(
          `You do not have the required permission: ${permission}.`,
        );
      }
    }

    return true;
  }
}
