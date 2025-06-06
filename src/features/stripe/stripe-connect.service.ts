import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConnectService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createConnectAccount(userId: string, type: 'INSTRUCTOR' | 'SELLER') {
    try {
      // Create Stripe Connect account
      const account = await this.stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId,
          accountType: type,
        },
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/connect/refresh`,
        return_url: `${this.configService.get('FRONTEND_URL')}/connect/return`,
        type: 'account_onboarding',
      });

      // Save Stripe account ID to user profile
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeAccountId: account.id,
          stripeAccountStatus: 'PENDING',
          accountType: type,
        },
      });

      return {
        accountId: account.id,
        accountLink: accountLink.url,
      };
    } catch (error) {
      throw new Error(`Failed to create Stripe Connect account: ${error.message}`);
    }
  }

  async getAccountStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true },
    });

    if (!user?.stripeAccountId) {
      throw new Error('No Stripe account found for user');
    }

    const account = await this.stripe.accounts.retrieve(user.stripeAccountId);
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
    };
  }

  async createAccountLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true },
    });

    if (!user?.stripeAccountId) {
      throw new Error('No Stripe account found for user');
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/connect/refresh`,
      return_url: `${this.configService.get('FRONTEND_URL')}/connect/return`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        await this.prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeAccountStatus: account.charges_enabled ? 'ACTIVE' : 'PENDING',
          },
        });
        break;

      case 'account.application.deauthorized':
        const deauthorizedAccount = event.data.object as unknown as Stripe.Account;
        await this.prisma.user.updateMany({
          where: { stripeAccountId: deauthorizedAccount.id },
          data: {
            stripeAccountStatus: 'DEAUTHORIZED',
          },
        });
        break;
    }
  }
} 