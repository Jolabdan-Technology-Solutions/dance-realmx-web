import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../tenants.service';

export const TENANT_KEY = 'tenant';
export const RequireTenant = () => SetMetadata(TENANT_KEY, true);

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireTenant = this.reflector.getAllAndOverride<boolean>(
      TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user, params, query } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    // Get tenant ID from params, query, or request body
    const tenantId = params.tenantId || query.tenantId || request.body.tenantId;

    if (!tenantId) {
      return false;
    }

    // Check if user belongs to the tenant
    const userRoles = await this.tenantsService.getUserTenantRoles(
      user.id,
      +tenantId,
    );

    if (!userRoles.length) {
      return false;
    }

    // Add tenant context to request for use in controllers
    request.tenantContext = {
      tenantId: +tenantId,
      roles: userRoles.map((role) => role.role),
    };

    return true;
  }
}
