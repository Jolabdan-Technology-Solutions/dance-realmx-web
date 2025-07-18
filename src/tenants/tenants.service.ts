import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    return this.prisma.tenant.create({
      data: {
        name,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async remove(id: number) {
    return this.prisma.tenant.delete({
      where: { id },
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
        role,
      },
    });
  }

  async getUserTenantRoles(userId: number, tenantId: number) {
    return this.prisma.userRoleMapping.findMany({
      where: {
        user_id: userId,
      },
      select: { role: true },
    });
  }

  async getTenantUsers(tenantId: number) {
    return this.prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: {
        role_mappings: true,
      },
    });
  }

  async getTenantById(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
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
