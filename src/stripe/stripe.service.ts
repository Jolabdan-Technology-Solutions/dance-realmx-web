import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }) {
    return this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
    });
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }
}
