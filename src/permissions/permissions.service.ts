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
        role_mappings: true,
      },
    });

    if (!user) return false;

    // Check if user has any role with the required permission
    for (const roleMapping of user.role_mappings) {
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
      [UserRole.CURRICULUM_ADMIN]: ['*'],
      [UserRole.COURSE_CREATOR_ADMIN]: ['*'],
      [UserRole.INSTRUCTOR_ADMIN]: ['*'],
      [UserRole.INSTRUCTOR]: [
        'view_own_courses',
        'edit_own_courses',
        'view_own_analytics',
        'view_own_enrollments',
        'view_own_revenue',
      ],
      [UserRole.CURRICULUM_SELLER]: [
        'view_own_resources',
        'edit_own_resources',
        'view_own_sales',
      ],
      [UserRole.BOOKING_PROFESSIONAL]: [
        'view_own_bookings',
        'manage_own_bookings',
      ],
      [UserRole.STUDENT]: ['view_own_enrollments', 'view_own_progress'],
      [UserRole.BOOKING_USER]: ['view_own_bookings'],
      [UserRole.GUEST_USER]: ['view_public_content'],
      [UserRole.DIRECTORY_MEMBER]: ['view_directory', 'edit_own_profile'],
      [UserRole.CERTIFICATION_MANAGER]: [
        'view_certifications',
        'manage_certifications',
      ],
    };

    const permissions = rolePermissions[role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}
