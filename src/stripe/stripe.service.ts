import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  private handleStripeError(error: any, context: string): never {
    this.logger.error(
      `Stripe error in ${context}: ${error.message}`,
      error.stack,
    );

    if (error instanceof Stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeCardError':
          throw new BadRequestException('The card was declined');
        case 'StripeInvalidRequestError':
          throw new BadRequestException(error.message);
        case 'StripeAPIError':
          throw new InternalServerErrorException('Stripe API error');
        case 'StripeConnectionError':
          throw new InternalServerErrorException('Stripe connection error');
      }
    }
    // Always throw as a fallback
    throw new InternalServerErrorException('An unknown Stripe error occurred');
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  async createPaymentIntent(options: Stripe.PaymentIntentCreateParams) {
    try {
      return await this.stripe.paymentIntents.create(options);
    } catch (error) {
      this.handleStripeError(error, 'createPaymentIntent');
    }
  }
}
