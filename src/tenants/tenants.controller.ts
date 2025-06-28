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
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequireFeature(Feature.MANAGE_TENANTS)
  create(@Body('name') name: string) {
    return this.tenantsService.create(name);
  }

  @Get(':id')
  @RequireFeature(Feature.MANAGE_TENANTS)
  findOne(@Param('id') id: string) {
    return this.tenantsService.getTenantById(+id);
  }

  @Patch(':id')
  @RequireFeature(Feature.MANAGE_TENANTS)
  update(@Param('id') id: string, @Body() data: { name?: string }) {
    return this.tenantsService.updateTenant(+id, data);
  }

  @Delete(':id')
  @RequireFeature(Feature.MANAGE_TENANTS)
  remove(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(+id);
  }

  @Post(':tenantId/users/:userId')
  @RequireFeature(Feature.MANAGE_TENANTS)
  assignUserToTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantsService.assignUserToTenant(+userId, +tenantId);
  }

  @Post(':tenantId/users/:userId/roles')
  @RequireFeature(Feature.MANAGE_TENANTS)
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
  @RequireFeature(Feature.MANAGE_TENANTS)
  getTenantUsers(@Param('tenantId') tenantId: string) {
    return this.tenantsService.getTenantUsers(+tenantId);
  }
}
