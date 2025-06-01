import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Subscription, SubscriptionTier } from '@prisma/client';
import { SubscriptionStatus } from './enums/subscription-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(id: number): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: number): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
    });
  }

  async findActive(userId: number): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
        current_period_end: {
          gt: new Date(),
        },
      },
    });
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async create(data: {
    user_id: number;
    tier: SubscriptionTier;
    stripe_subscription_id: string;
    current_period_start: Date;
    current_period_end: Date;
    status: SubscriptionStatus;
  }): Promise<Subscription> {
    const subscription = await this.prisma.subscription.create({
      data,
      include: {
        user: true,
      },
    });

    // Get user details for email
    const user = await this.prisma.user.findUnique({
      where: { id: data.user_id },
    });

    if (user) {
      await this.mailService.sendSubscriptionConfirmation(
        user.email,
        user.first_name || user.username,
        data.tier,
        data.current_period_start,
        data.current_period_end,
      );
    }

    return subscription;
  }

  async update(id: number, data: Partial<Subscription>): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async updateStatus(
    id: number,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: number): Promise<Subscription> {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
