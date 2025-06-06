import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { StripeConnectService } from '../stripe/stripe-connect.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [StripeConnectService],
  exports: [StripeConnectService],
})
export class AdminModule {} 