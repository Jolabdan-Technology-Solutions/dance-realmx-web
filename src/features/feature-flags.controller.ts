import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  async getUserFeatures(@Param('userId') userId: string) {
    return this.featureFlagsService.getEnabledFeatures(+userId);
  }

  @Post('role/:role')
  @Roles(UserRole.ADMIN)
  async updateRoleFeatures(
    @Param('role') role: UserRole,
    @Body('features') features: string[],
  ) {
    await this.featureFlagsService.updateRoleFeatures(role, features);
    return { message: 'Role features updated successfully' };
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  async getRoleFeatures(@Param('role') role: UserRole) {
    const isEnabled = await this.featureFlagsService.isFeatureEnabledForRole(
      role,
      '*',
    );
    return {
      role,
      features: isEnabled
        ? ['*']
        : Array.from(
            this.featureFlagsService['roleFeatureFlags'].get(role) || [],
          ),
    };
  }

  @Get('check/:role')
  async checkFeatures(@Param('role') role: UserRole) {
    const features = await this.featureFlagsService.isFeatureEnabledForRole(
      role,
      '*',
    );
    return {
      role,
      features,
    };
  }
}
