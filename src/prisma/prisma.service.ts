import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Expose models with proper typing
  get category() {
    return this.category;
  }

  get instructor() {
    return this.instructor;
  }

  get user() {
    return this.user;
  }

  get profile() {
    return this.profile;
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

  get cartItem() {
    return this.cartItem;
  }

  get order() {
    return this.order;
  }

  get passwordReset() {
    return this.passwordReset;
  }

  get emailVerification() {
    return this.emailVerification;
  }

  get UserRole() {
    return this.UserRole;
  }

  get quiz() {
    return this.quiz;
  }

  get quizQuestion() {
    return this.quizQuestion;
  }

  get quizAttempt() {
    return this.quizAttempt;
  }
}
