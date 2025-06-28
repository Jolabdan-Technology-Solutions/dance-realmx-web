import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, Prisma, UserRole } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { ResourceOwner } from '../auth/guards/resource-owner.guard';
import { Request } from 'express';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';

enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELED = 'CANCELED',
}

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('payments')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequireFeature(Feature.VIEW_PAYMENT_HISTORY)
  findAll(@Query() query: QueryPaymentDto, @Req() req: RequestWithUser) {
    return this.paymentsService.findAll(query, req.user.id);
  }

  @Get('revenue')
  @RequireFeature(Feature.MANAGE_PAYMENTS)
  async getTotalRevenue() {
    return this.paymentsService.getTotalRevenue();
  }

  @Get(':id')
  @RequireFeature(Feature.VIEW_PAYMENT_HISTORY)
  @ResourceOwner('payment')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.paymentsService.findOne(+id, req.user.id);
  }

  @Post()
  @RequireFeature(Feature.MAKE_PAYMENTS)
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.paymentsService.create(createPaymentDto, req.user.id);
  }

  @Patch(':id')
  @RequireFeature(Feature.MANAGE_PAYMENTS)
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: Prisma.PaymentUpdateInput,
  ) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Patch(':id/status')
  @RequireFeature(Feature.MANAGE_PAYMENTS)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ) {
    return this.paymentsService.updateStatus(+id, status);
  }

  @Delete(':id')
  @RequireFeature(Feature.MANAGE_PAYMENTS)
  async remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }
    return this.paymentsService.handleWebhook(signature, req.rawBody);
  }

  @Post('checkout')
  async createOneTimeCheckout(
    @Body() dto: { itemId: number; type: 'COURSE' | 'RESOURCE'; email: string },
  ) {
    return this.paymentsService.createOneTimeCheckoutSession(dto);
  }
}
