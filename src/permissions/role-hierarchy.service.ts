import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoleHierarchyService {
  private readonly roleHierarchy: Map<UserRole, UserRole[]> = new Map([
    [
      UserRole.ADMIN,
      [
        UserRole.CURRICULUM_ADMIN,
        UserRole.COURSE_CREATOR_ADMIN,
        UserRole.INSTRUCTOR_ADMIN,
        UserRole.CURRICULUM_SELLER,
        UserRole.BOOKING_PROFESSIONAL,
        UserRole.STUDENT,
        UserRole.BOOKING_USER,
        UserRole.GUEST_USER,
      ],
    ],
    [
      UserRole.CURRICULUM_ADMIN,
      [UserRole.CURRICULUM_SELLER, UserRole.STUDENT, UserRole.GUEST_USER],
    ],
    [
      UserRole.COURSE_CREATOR_ADMIN,
      [UserRole.BOOKING_PROFESSIONAL, UserRole.STUDENT, UserRole.GUEST_USER],
    ],
    [
      UserRole.INSTRUCTOR_ADMIN,
      [
        UserRole.BOOKING_PROFESSIONAL,
        UserRole.BOOKING_USER,
        UserRole.GUEST_USER,
      ],
    ],
  ]);

  private readonly rolePermissions: Map<UserRole, string[]> = new Map([
    [UserRole.ADMIN, ['*']],
    [
      UserRole.CURRICULUM_ADMIN,
      ['manage:curriculum', 'manage:courses', 'view:analytics'],
    ],
    [
      UserRole.COURSE_CREATOR_ADMIN,
      ['manage:instructors', 'manage:courses', 'view:analytics'],
    ],
    [
      UserRole.INSTRUCTOR_ADMIN,
      ['manage:instructors', 'manage:bookings', 'view:analytics'],
    ],
    [
      UserRole.CURRICULUM_SELLER,
      ['create:curriculum', 'edit:own:curriculum', 'view:own:analytics'],
    ],
    [
      UserRole.BOOKING_PROFESSIONAL,
      ['manage:own:bookings', 'create:courses', 'view:own:analytics'],
    ],
    [
      UserRole.STUDENT,
      ['enroll:courses', 'view:enrolled:courses', 'view:own:progress'],
    ],
    [
      UserRole.BOOKING_USER,
      ['book:sessions', 'view:own:bookings', 'view:own:progress'],
    ],
    [UserRole.GUEST_USER, ['view:public:courses', 'view:public:instructors']],
  ]);

  hasPermission(role: UserRole, permission: string): boolean {
    const permissions = this.rolePermissions.get(role) || [];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  getInheritedRoles(role: UserRole): UserRole[] {
    return this.roleHierarchy.get(role) || [];
  }

  getAllPermissions(role: UserRole): string[] {
    const permissions = new Set<string>();
    const roles = [role, ...this.getInheritedRoles(role)];

    roles.forEach((r) => {
      const rolePerms = this.rolePermissions.get(r) || [];
      rolePerms.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }

  canAccessResource(
    role: UserRole,
    resourceType: string,
    action: string,
  ): boolean {
    const permission = `${action}:${resourceType}`;
    return this.hasPermission(role, permission);
  }
}
