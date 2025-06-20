import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';
import { UserRole } from '@prisma/client';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body('name') name: string) {
    return this.tenantsService.create(name);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.tenantsService.getTenantById(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() data: { name?: string }) {
    return this.tenantsService.updateTenant(+id, data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(+id);
  }

  @Post(':tenantId/users/:userId')
  @Roles(Role.ADMIN)
  assignUserToTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantsService.assignUserToTenant(+userId, +tenantId);
  }

  @Post(':tenantId/users/:userId/roles')
  @Roles(Role.ADMIN)
  assignRoleToUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.tenantsService.assignRoleToUserInTenant(
      +userId,
      +tenantId,
      role,
    );
  }

  @Get(':tenantId/users')
  @Roles(Role.ADMIN)
  getTenantUsers(@Param('tenantId') tenantId: string) {
    return this.tenantsService.getTenantUsers(+tenantId);
  }
}
