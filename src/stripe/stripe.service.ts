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
          throw new InternalServerErrorException('Failed to connect to Stripe');
        case 'StripeAuthenticationError':
          throw new InternalServerErrorException(
            'Stripe authentication failed',
          );
        case 'StripePermissionError':
          throw new InternalServerErrorException('Insufficient permissions');
        case 'StripeRateLimitError':
          throw new InternalServerErrorException('Too many requests to Stripe');
        case 'StripeInvalidGrantError':
          throw new InternalServerErrorException('Invalid grant');
        default:
          throw new InternalServerErrorException(
            'An unexpected error occurred with Stripe',
          );
      }
    }
    throw error;
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      if (!data.amount || data.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (!data.currency) {
        throw new BadRequestException('Currency is required');
      }

      return await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        metadata: data.metadata,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return this.handleStripeError(error, 'createPaymentIntent');
    }
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      if (!paymentIntentId) {
        throw new BadRequestException('Payment intent ID is required');
      }

      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return this.handleStripeError(error, 'retrievePaymentIntent');
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      if (!paymentIntentId) {
        throw new BadRequestException('Payment intent ID is required');
      }

      const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        throw new BadRequestException('Payment intent is already succeeded');
      }

      if (paymentIntent.status === 'canceled') {
        throw new BadRequestException('Payment intent is already canceled');
      }

      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return this.handleStripeError(error, 'confirmPaymentIntent');
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      if (!paymentIntentId) {
        throw new BadRequestException('Payment intent ID is required');
      }

      const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        throw new BadRequestException(
          'Cannot cancel a succeeded payment intent',
        );
      }

      if (paymentIntent.status === 'canceled') {
        throw new BadRequestException('Payment intent is already canceled');
      }

      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return this.handleStripeError(error, 'cancelPaymentIntent');
    }
  }
}
