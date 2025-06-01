import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async assignRolesToUser(userId: number, roles: UserRole[]) {
    // First, remove existing roles
    await this.prisma.userRoleMapping.deleteMany({
      where: { user_id: userId },
    });

    // Then add new roles
    const roleMappings = roles.map((role) => ({
      user_id: userId,
      role,
    }));

    return this.prisma.userRoleMapping.createMany({
      data: roleMappings,
    });
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    const roleMappings = await this.prisma.userRoleMapping.findMany({
      where: { user_id: userId },
      select: { role: true },
    });

    return roleMappings.map((mapping) => mapping.role);
  }

  async hasRole(userId: number, role: UserRole): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.includes(role);
  }

  async hasAnyRole(userId: number, roles: UserRole[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return roles.some((role) => userRoles.includes(role));
  }

  async hasAllRoles(userId: number, roles: UserRole[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return roles.every((role) => userRoles.includes(role));
  }

  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoleMapping: true,
      },
    });

    if (!user) return false;

    // Check if user has any role with the required permission
    for (const roleMapping of user.userRoleMapping) {
      if (await this.roleHasPermission(roleMapping.role, permission)) {
        return true;
      }
    }

    return false;
  }

  private async roleHasPermission(
    role: UserRole,
    permission: string,
  ): Promise<boolean> {
    // Define role-based permissions
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: ['*'],
      [UserRole.CURRICULUM_ADMIN]: [
        'manage_courses',
        'manage_modules',
        'manage_lessons',
        'view_analytics',
      ],
      [UserRole.COURSE_CREATOR_ADMIN]: [
        'create_courses',
        'edit_courses',
        'delete_courses',
        'view_analytics',
      ],
      [UserRole.INSTRUCTOR_ADMIN]: [
        'manage_schedule',
        'manage_bookings',
        'view_analytics',
      ],
      [UserRole.CURRICULUM_SELLER]: [
        'create_courses',
        'edit_courses',
        'view_analytics',
      ],
      [UserRole.BOOKING_PROFESSIONAL]: [
        'manage_schedule',
        'manage_bookings',
        'view_analytics',
      ],
      [UserRole.STUDENT]: ['view_courses', 'enroll_courses', 'view_progress'],
      [UserRole.BOOKING_USER]: [
        'view_schedule',
        'book_sessions',
        'view_history',
      ],
      [UserRole.GUEST_USER]: ['view_public_courses', 'view_instructors'],
    };

    const permissions = rolePermissions[role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}
