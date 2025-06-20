import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resource, ResourceCategory, PaymentStatus } from '@prisma/client';
import { CreateResourceDto } from './dto/create-resource.dto';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { MailService } from '../mail/mail.service';

interface FindAllOptions {
  type?: string;
  search?: string;
  danceStyle?: string;
  ageRange?: string;
  difficultyLevel?: string;
  priceRange?: string;
  sellerId?: number;
}

@Injectable()
export class ResourcesService implements OnModuleInit {
  private readonly logger = new Logger(ResourcesService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY is not defined in environment variables',
      );
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
      appInfo: {
        name: 'Dance Realm',
        version: '1.0.0',
      },
    });
  }

  private handlePrismaError(error: any, context: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A resource with this unique constraint already exists',
          );
        case 'P2025':
          throw new NotFoundException('Resource not found');
        case 'P2003':
          throw new BadRequestException(
            'Invalid reference: The referenced record does not exist',
          );
        default:
          throw new BadRequestException(`Database error: ${error.message}`);
      }
    }
    throw error;
  }

  async findAll(options: FindAllOptions = {}): Promise<Resource[]> {
    try {
      const {
        type,
        search,
        danceStyle,
        ageRange,
        difficultyLevel,
        priceRange,
        sellerId,
      } = options;

      // Build the where clause
      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (danceStyle) {
        where.danceStyle = danceStyle;
      }

      if (ageRange) {
        where.ageRange = ageRange;
      }

      if (difficultyLevel) {
        where.difficultyLevel = difficultyLevel;
      }

      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (isNaN(min) || (max && isNaN(max))) {
          throw new BadRequestException('Invalid price range format');
        }
        where.price = {
          gte: min,
          lte: max || undefined,
        };
      }

      if (sellerId) {
        const seller = await this.prisma.user.findUnique({
          where: { id: sellerId },
        });
        if (!seller) {
          throw new NotFoundException(`Seller with ID ${sellerId} not found`);
        }
        where.sellerId = sellerId;
      }

      return await this.prisma.resource.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'findAll');
    }
  }

  async findOne(id: number): Promise<Resource> {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });

      if (!resource) {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }

      return resource;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findOne');
    }
  }

  async findByCourse(courseId: number): Promise<Resource[]> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { course_id: courseId },
        include: {
          module: true,
          lesson: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByCourse: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByCourse');
    }
  }

  async findByModule(moduleId: number): Promise<Resource[]> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { module_id: moduleId },
        include: {
          course: true,
          lesson: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByModule: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByModule');
    }
  }

  async findByLesson(lessonId: number): Promise<Resource[]> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { lesson_id: lessonId },
        include: {
          course: true,
          module: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByLesson: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByLesson');
    }
  }

  async create(
    createResourceDto: CreateResourceDto,
    userId: number,
  ): Promise<Resource> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.resource.create({
        data: {
          ...createResourceDto,
          sellerId: userId,
        },
      });
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'create');
    }
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource> {
    try {
      const resource = await this.findOne(id);

      return await this.prisma.resource.update({
        where: { id },
        data,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'update');
    }
  }

  async delete(id: number): Promise<Resource> {
    try {
      const resource = await this.findOne(id);

      return await this.prisma.resource.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'delete');
    }
  }

  async purchase(resourceId: number, userId: number): Promise<any> {
    try {
      const resource = await this.findOne(resourceId);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user has already purchased this resource
      const existingPurchase = await this.prisma.resourcePurchase.findFirst({
        where: {
          resource_id: resourceId,
          user_id: userId,
          status: 'COMPLETED',
        },
      });

      if (existingPurchase) {
        throw new ConflictException('User has already purchased this resource');
      }

      // Check for pending purchase
      const pendingPurchase = await this.prisma.resourcePurchase.findFirst({
        where: {
          resource_id: resourceId,
          user_id: userId,
          status: 'PENDING',
        },
      });

      if (pendingPurchase) {
        // If there's a pending purchase, check if the payment intent is still valid
        if (pendingPurchase.stripe_payment_intent_id) {
          try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(
              pendingPurchase.stripe_payment_intent_id,
            );

            if (paymentIntent.status === 'requires_payment_method') {
              return {
                purchase: pendingPurchase,
                clientSecret: paymentIntent.client_secret,
              };
            }
          } catch (stripeError) {
            // If payment intent doesn't exist or is invalid, clean up the pending purchase
            await this.prisma.resourcePurchase.delete({
              where: { id: pendingPurchase.id },
            });
          }
        }
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round((resource.price || 0) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          resourceId: resourceId.toString(),
          userId: userId.toString(),
        },
      });

      // Create purchase record with pending status
      const purchase = await this.prisma.resourcePurchase.create({
        data: {
          resource_id: resourceId,
          user_id: userId,
          status: 'PENDING',
          amount: resource.price || 0,
          purchased_at: new Date(),
          stripe_payment_intent_id: paymentIntent.id,
        },
      });

      // Send purchase initiation email
      try {
        await this.mailService.sendCoursePurchaseConfirmation(
          user.email,
          user.first_name || user.username,
          resource.title,
          resource.price,
        );
      } catch (emailError) {
        this.logger.error(
          'Failed to send purchase initiation email:',
          emailError,
        );
      }

      return {
        purchase,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(`Error in purchase: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      return this.handlePrismaError(error, 'purchase');
    }
  }

  async confirmPurchase(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment not successful');
      }

      const purchase = await this.prisma.resourcePurchase.findFirst({
        where: { stripe_payment_intent_id: paymentIntentId },
        include: {
          resource: true,
          user: true,
        },
      });

      if (!purchase) {
        throw new NotFoundException('Purchase record not found');
      }

      // Update purchase record with completed status
      const updatedPurchase = await this.prisma.resourcePurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
        },
        include: {
          resource: true,
          user: true,
        },
      });

      // Send purchase confirmation email
      try {
        await this.mailService.sendCoursePurchaseConfirmation(
          purchase.user.email,
          purchase.user.first_name || purchase.user.username,
          purchase.resource.title,
          purchase.amount,
        );
      } catch (emailError) {
        this.logger.error(
          'Failed to send purchase confirmation email:',
          emailError,
        );
      }

      return updatedPurchase;
    } catch (error) {
      this.logger.error(
        `Error in confirmPurchase: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'confirmPurchase');
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new InternalServerErrorException(
          'STRIPE_WEBHOOK_SECRET is not defined',
        );
      }

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmPurchase(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object.id);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw new InternalServerErrorException('Failed to process webhook event');
    }
  }

  private async handlePaymentFailed(paymentIntentId: string) {
    try {
      const purchase = await this.prisma.resourcePurchase.findFirst({
        where: { stripe_payment_intent_id: paymentIntentId },
      });

      if (purchase) {
        await this.prisma.resourcePurchase.delete({
          where: { id: purchase.id },
        });
      }
    } catch (error) {
      this.logger.error('Error handling failed payment:', error);
      throw new InternalServerErrorException(
        'Failed to process failed payment',
      );
    }
  }

  async findByCategory(categoryId: number): Promise<Resource[]> {
    try {
      const category = await this.prisma.resourceCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { categoryId },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error in findByCategory: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByCategory');
    }
  }

  async findBySeller(sellerId: number): Promise<Resource[]> {
    try {
      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { sellerId },
        include: {
          category: true,
          purchases: {
            select: {
              id: true,
              status: true,
              amount: true,
              created_at: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error in findBySeller: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findBySeller');
    }
  }

  async getResourceStats(resourceId: number): Promise<any> {
    try {
      const resource = await this.findOne(resourceId);

      const stats = await this.prisma.resourcePurchase.aggregate({
        where: { resource_id: resourceId },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      return {
        resource,
        totalPurchases: stats._count.id,
        totalRevenue: stats._sum.amount || 0,
      };
    } catch (error) {
      this.logger.error(
        `Error in getResourceStats: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'getResourceStats');
    }
  }

  async getSellerStats(sellerId: number): Promise<any> {
    try {
      const seller = await this.prisma.user.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found`);
      }

      const resources = await this.prisma.resource.findMany({
        where: { sellerId },
        include: {
          purchases: true,
        },
      });

      const stats = {
        totalResources: resources.length,
        totalPurchases: 0,
        totalRevenue: 0,
        resources: resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          purchases: resource.purchases.length,
          revenue: resource.purchases.reduce(
            (sum, purchase) => sum + purchase.amount,
            0,
          ),
        })),
      };

      resources.forEach((resource) => {
        stats.totalPurchases += resource.purchases.length;
        stats.totalRevenue += resource.purchases.reduce(
          (sum, purchase) => sum + purchase.amount,
          0,
        );
      });

      return stats;
    } catch (error) {
      this.logger.error(
        `Error in getSellerStats: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'getSellerStats');
    }
  }

  async searchResources(query: string): Promise<Resource[]> {
    try {
      return await this.prisma.resource.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { danceStyle: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error in searchResources: ${error.message}`,
        error.stack,
      );
      return this.handlePrismaError(error, 'searchResources');
    }
  }

  async getPopularResources(limit: number = 10): Promise<Resource[]> {
    try {
      return await this.prisma.resource.findMany({
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
          purchases: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          purchases: {
            _count: 'desc',
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error in getPopularResources: ${error.message}`,
        error.stack,
      );
      return this.handlePrismaError(error, 'getPopularResources');
    }
  }
}
