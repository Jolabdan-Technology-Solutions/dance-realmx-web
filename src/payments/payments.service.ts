import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { Prisma } from '@prisma/client';
import { PaymentStatus, PaymentType } from '@prisma/client';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async create(createPaymentDto: CreatePaymentDto, userId: number) {
    const {
      amount,
      type,
      reference_id,
      currency = 'usd',
      stripe_customer_id,
    } = createPaymentDto;

    // Get or create Stripe customer
    let customerId = stripe_customer_id;
    if (!customerId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { stripe_customer: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.stripe_customer) {
        customerId = user.stripe_customer.stripe_customer_id;
      } else {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
        });

        await this.prisma.stripeCustomer.create({
          data: {
            user_id: userId,
            stripe_customer_id: customer.id,
          },
        });

        customerId = customer.id;
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata: {
        type,
        reference_id: reference_id.toString(),
        user_id: userId.toString(),
      },
    });

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        amount,
        type,
        reference_id,
        status: PaymentStatus.PENDING,
        metadata: {
          client_secret: paymentIntent.client_secret,
          currency,
        },
      },
    });

    return {
      ...payment,
      client_secret: paymentIntent.client_secret,
    };
  }

  async findAll(query: QueryPaymentDto, userId: number) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.PaymentWhereInput = {
      AND: [
        { user_id: userId },
        status ? { status: status as PaymentStatus } : {},
        type ? { type: type as PaymentType } : {},
      ],
    };

    // Build the orderBy clause
    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    orderBy[sort_by] = sort_order;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getTotalRevenue() {
    const result = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      total: result._sum.amount || 0,
    };
  }

  async update(id: number, updatePaymentDto: Prisma.PaymentUpdateInput) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
    });
  }

  async updateStatus(id: number, status: PaymentStatus) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    try {
      const webhookSecret = this.configService.get<string>(
        'STRIPE_WEBHOOK_SECRET',
      );
      if (!webhookSecret) {
        throw new Error(
          'STRIPE_WEBHOOK_SECRET is not defined in environment variables',
        );
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;
      }

      return { received: true };
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { id, metadata } = paymentIntent;
    const { type, reference_id, user_id } = metadata;

    await this.prisma.payment.update({
      where: { stripe_payment_intent_id: id },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    // Handle different payment types
    switch (type) {
      case PaymentType.COURSE:
        await this.handleCoursePurchase(Number(reference_id), Number(user_id));
        break;
      case PaymentType.RESOURCE:
        await this.handleResourcePurchase(
          Number(reference_id),
          Number(user_id),
        );
        break;
      case PaymentType.SUBSCRIPTION:
        await this.handleSubscriptionPurchase(
          Number(reference_id),
          Number(user_id),
        );
        break;
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    await this.prisma.payment.update({
      where: { stripe_payment_intent_id: paymentIntent.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  private async handleRefund(charge: Stripe.Charge) {
    if (!charge.payment_intent) {
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        stripe_payment_intent_id: charge.payment_intent.toString(),
      },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status:
            charge.amount_refunded === charge.amount
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });
    }
  }

  private async handleCoursePurchase(courseId: number, userId: number) {
    // Implement course purchase logic
  }

  private async handleResourcePurchase(resourceId: number, userId: number) {
    // Implement resource purchase logic
  }

  private async handleSubscriptionPurchase(
    subscriptionId: number,
    userId: number,
  ) {
    // Implement subscription purchase logic
  }
}
