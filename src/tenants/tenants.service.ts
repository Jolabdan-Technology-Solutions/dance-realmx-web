import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async createTenant(name: string) {
    return this.prisma.tenant.create({
      data: { name },
    });
  }

  async assignUserToTenant(userId: number, tenantId: number) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { tenant_id: tenantId },
    });
  }

  async assignRoleToUserInTenant(
    userId: number,
    tenantId: number,
    role: UserRole,
  ) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.userRoleMapping.create({
      data: {
        user_id: userId,
        tenant_id: tenantId,
        role,
      },
    });
  }

  async getUserTenantRoles(userId: number, tenantId: number) {
    return this.prisma.userRoleMapping.findMany({
      where: {
        user_id: userId,
        tenant_id: tenantId,
      },
      select: { role: true },
    });
  }

  async getTenantUsers(tenantId: number) {
    return this.prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: {
        userRoleMapping: {
          where: { tenant_id: tenantId },
        },
      },
    });
  }

  async getTenantById(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        userRoleMappings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: number, data: { name?: string }) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async deleteTenant(id: number) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
