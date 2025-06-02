import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Expose models with proper typing
  get category() {
    return this.category;
  }

  get user() {
    return this.user;
  }

  get course() {
    return this.course;
  }

  get module() {
    return this.module;
  }

  get lesson() {
    return this.lesson;
  }

  get enrollment() {
    return this.enrollment;
  }

  get testimonial() {
    return this.testimonial;
  }

  get stripeCustomer() {
    return this.stripeCustomer;
  }

  get subscription() {
    return this.subscription;
  }

  get booking() {
    return this.booking;
  }

  get userCertification() {
    return this.userCertification;
  }

  get resourceCategory() {
    return this.resourceCategory;
  }

  get resource() {
    return this.resource;
  }

  get resourcePurchase() {
    return this.resourcePurchase;
  }

  get payment() {
    return this.payment;
  }

  get userRoleMapping() {
    return this.userRoleMapping;
  }

  get userFeature() {
    return this.userFeature;
  }

  get notification() {
    return this.notification;
  }

  get message() {
    return this.message;
  }

  get tag() {
    return this.tag;
  }

  get review() {
    return this.review;
  }
}
