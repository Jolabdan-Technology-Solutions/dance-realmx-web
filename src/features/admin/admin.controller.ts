import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { StripeConnectService } from '../stripe/stripe-connect.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @Post('connect-accounts/:userId')
  @ApiOperation({ summary: 'Create Stripe Connect account for user' })
  @ApiResponse({
    status: 201,
    description: 'Stripe Connect account created successfully',
  })
  async createConnectAccount(
    @Param('userId') userId: string,
    @Body() body: { type: 'INSTRUCTOR' | 'SELLER' },
  ) {
    return this.stripeConnectService.createConnectAccount(userId, body.type);
  }

  @Get('connect-accounts/:userId/status')
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  @ApiResponse({
    status: 200,
    description: 'Returns Stripe Connect account status',
  })
  async getConnectAccountStatus(@Param('userId') userId: string) {
    return this.stripeConnectService.getAccountStatus(userId);
  }

  @Post('connect-accounts/:userId/onboarding')
  @ApiOperation({ summary: 'Create onboarding link for Stripe Connect account' })
  @ApiResponse({
    status: 200,
    description: 'Returns onboarding link',
  })
  async createOnboardingLink(@Param('userId') userId: string) {
    return this.stripeConnectService.createAccountLink(userId);
  }

  @Get('connect-accounts')
  @ApiOperation({ summary: 'List all Stripe Connect accounts' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of Stripe Connect accounts',
  })
  async listConnectAccounts() {
    // Implementation for listing all connect accounts
    return [];
  }

  @Post('connect-accounts/:userId/verify')
  @ApiOperation({ summary: 'Verify Stripe Connect account' })
  @ApiResponse({
    status: 200,
    description: 'Account verified successfully',
  })
  async verifyConnectAccount(@Param('userId') userId: string) {
    // Implementation for verifying connect account
    return { status: 'verified' };
  }
} 