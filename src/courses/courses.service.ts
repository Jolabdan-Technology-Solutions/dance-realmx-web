import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course, Module, Lesson, Prisma } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { MailService } from '../mail/mail.service';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class CoursesService implements OnModuleInit {
  private readonly logger = new Logger(CoursesService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.logger.log('CoursesService initialized');
  }

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

  async create(createCourseDto: CreateCourseDto) {
    try {
      const { instructor_id, category_id, ...courseData } = createCourseDto;

      // Check if instructor exists
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructor_id },
      });
      if (!instructor) {
        throw new NotFoundException(
          `Instructor with ID ${instructor_id} not found`,
        );
      }

      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id: category_id },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${category_id} not found`,
        );
      }

      return await this.prisma.course.create({
        data: {
          ...courseData,
          instructor: {
            connect: {
              id: instructor_id,
            },
          },
          categories: {
            connect: {
              id: category_id,
            },
          },
        },
        include: {
          instructor: true,
          categories: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A course with this title already exists',
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryCourseDto) {
    const {
      page = 1,
      limit = 10,
      instructor_id,
      search,
      min_price,
      max_price,
      category_ids,
      tag_ids,
      min_rating,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.CourseWhereInput = {
      ...(instructor_id && { instructor_id }),
      ...(min_price !== undefined && { price: { gte: min_price } }),
      ...(max_price !== undefined && { price: { lte: max_price } }),
      ...(category_ids?.length && {
        categories: { some: { id: { in: category_ids } } },
      }),
      ...(tag_ids?.length && {
        tags: { some: { id: { in: tag_ids } } },
      }),
      ...(min_rating && {
        reviews: { some: { rating: { gte: min_rating } } },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    // Build the orderBy clause
    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (sort_by === 'price') {
      orderBy.price = sort_order;
    } else if (sort_by === 'popularity') {
      orderBy.created_at = sort_order;
    } else {
      orderBy.created_at = sort_order;
    }
    // Note: Sorting by average rating must be done in JS after fetching, as Prisma does not support orderBy on related reviews.

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          instructor: true,
          modules: {
            include: {
              lessons: true,
            },
          },
          categories: true,
          tags: true,
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
    ]);

    // Calculate average ratings
    const coursesWithStats = courses.map((course) => ({
      ...course,
      average_rating: course.reviews.length
        ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
          course.reviews.length
        : 0,
      enrollment_count: course._count.enrollments,
    }));

    return {
      data: coursesWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          instructor: true,
          modules: {
            include: {
              lessons: true,
            },
          },
          categories: true,
          tags: true,
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile_image_url: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      // Calculate average rating
      const averageRating = course.reviews.length
        ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
          course.reviews.length
        : 0;

      return {
        ...course,
        average_rating: averageRating,
        enrollment_count: course._count.enrollments,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch course details');
    }
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      const { instructor_id, category_id, ...updateData } = updateCourseDto;

      // If instructor_id is provided, check if it exists
      if (instructor_id) {
        const instructor = await this.prisma.user.findUnique({
          where: { id: instructor_id },
        });
        if (!instructor) {
          throw new NotFoundException(
            `Instructor with ID ${instructor_id} not found`,
          );
        }
      }

      // If category_id is provided, check if it exists
      if (category_id) {
        const category = await this.prisma.category.findUnique({
          where: { id: category_id },
        });
        if (!category) {
          throw new NotFoundException(
            `Category with ID ${category_id} not found`,
          );
        }
      }

      return await this.prisma.course.update({
        where: { id },
        data: {
          ...updateData,
          ...(instructor_id && {
            instructor: {
              connect: {
                id: instructor_id,
              },
            },
          }),
          ...(category_id && {
            categories: {
              set: [], // Clear existing categories
              connect: {
                id: category_id,
              },
            },
          }),
        },
        include: {
          instructor: true,
          categories: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A course with this title already exists',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      return await this.prisma.course.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot delete course with existing enrollments or modules',
          );
        }
      }
      throw error;
    }
  }

  async toggleVisibility(id: number) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      return await this.prisma.course.update({
        where: { id },
        data: {
          visible: !course.visible,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Module methods
  async createModule(data: {
    title: string;
    description: string;
    order: number;
    course_id: number;
  }) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.course_id },
      });
      if (!course) {
        throw new NotFoundException(
          `Course with ID ${data.course_id} not found`,
        );
      }

      return await this.prisma.module.create({
        data,
        include: {
          course: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A module with this title already exists in this course',
          );
        }
      }
      throw error;
    }
  }

  async getModules(courseId: number) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      return await this.prisma.module.findMany({
        where: { course_id: courseId },
        include: {
          lessons: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch modules');
    }
  }

  async updateModule(
    id: number,
    data: { title?: string; description?: string; order?: number },
  ) {
    try {
      // Check if module exists
      const module = await this.prisma.module.findUnique({
        where: { id },
      });
      if (!module) {
        throw new NotFoundException(`Module with ID ${id} not found`);
      }

      return await this.prisma.module.update({
        where: { id },
        data,
        include: {
          course: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A module with this title already exists in this course',
          );
        }
      }
      throw error;
    }
  }

  async deleteModule(id: number) {
    try {
      // Check if module exists
      const module = await this.prisma.module.findUnique({
        where: { id },
      });
      if (!module) {
        throw new NotFoundException(`Module with ID ${id} not found`);
      }

      return await this.prisma.module.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot delete module with existing lessons',
          );
        }
      }
      throw error;
    }
  }

  // Lesson methods
  async createLesson(data: {
    title: string;
    content: string;
    video_url?: string;
    order: number;
    module_id: number;
  }) {
    return this.prisma.lesson.create({
      data,
      include: {
        module: true,
      },
    });
  }

  async updateLesson(
    id: number,
    data: {
      title?: string;
      content?: string;
      video_url?: string;
      order?: number;
    },
  ) {
    return this.prisma.lesson.update({
      where: { id },
      data,
      include: {
        module: true,
      },
    });
  }

  async deleteLesson(id: number) {
    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async getLessonsByModule(moduleId: number) {
    try {
      // Check if module exists
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });
      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      return await this.prisma.lesson.findMany({
        where: { module_id: moduleId },
        orderBy: {
          order: 'asc',
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              course_id: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch lessons for module',
      );
    }
  }

  async purchaseCourse(userId: number, courseId: number) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check for ANY existing enrollment (regardless of status)
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
        },
      });

      // If enrollment exists, handle based on status
      if (existingEnrollment) {
        // If already active or completed, throw conflict
        if (['ACTIVE', 'COMPLETED'].includes(existingEnrollment.status)) {
          throw new ConflictException(
            'User is already enrolled in this course',
          );
        }

        // If pending, check for existing payment
        if (existingEnrollment.status === 'PENDING') {
          const existingPayment = await this.prisma.payment.findFirst({
            where: {
              user_id: userId,
              reference_id: courseId,
              reference_type: 'COURSE',
              status: 'PENDING',
            },
          });

          if (existingPayment && existingPayment.stripe_session_id) {
            try {
              const existingSession =
                await this.stripe.checkout.sessions.retrieve(
                  existingPayment.stripe_session_id,
                );

              if (existingSession.status === 'open') {
                return {
                  enrollment: existingEnrollment,
                  url: existingSession.url,
                };
              }

              // Clean up expired sessions
              if (existingSession.status === 'expired') {
                await this.prisma.$transaction([
                  this.prisma.enrollment.delete({
                    where: { id: existingEnrollment.id },
                  }),
                  this.prisma.payment.delete({
                    where: { id: existingPayment.id },
                  }),
                ]);
              }
            } catch (stripeError) {
              // If session doesn't exist in Stripe, clean up our records
              await this.prisma.$transaction([
                this.prisma.enrollment.delete({
                  where: { id: existingEnrollment.id },
                }),
                this.prisma.payment.delete({
                  where: { id: existingPayment.id },
                }),
              ]);
            }
          } else {
            // If pending enrollment exists but no valid payment, clean it up
            await this.prisma.enrollment.delete({
              where: { id: existingEnrollment.id },
            });
          }
        }
      }

      // Create Stripe checkout session
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description,
              },
              unit_amount: Math.round(course.price * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/courses/success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`,
        cancel_url: `${process.env.FRONTEND_URL}/courses`,
        metadata: {
          userId: userId.toString(),
          courseId: courseId.toString(),
        },
      });

      // Create records in a transaction with better error handling
      const result = await this.prisma.$transaction(async (prisma) => {
        // Double-check for enrollment inside transaction to prevent race conditions
        const doubleCheckEnrollment = await prisma.enrollment.findFirst({
          where: {
            user_id: userId,
            course_id: courseId,
          },
        });

        if (doubleCheckEnrollment) {
          throw new ConflictException(
            'User is already enrolled in this course',
          );
        }

        const enrollment = await prisma.enrollment.create({
          data: {
            user_id: userId,
            course_id: courseId,
            status: 'PENDING',
          },
        });

        const payment = await prisma.payment.create({
          data: {
            user_id: userId,
            reference_id: courseId,
            amount: course.price,
            reference_type: 'COURSE',
            status: 'PENDING',
            stripe_session_id: session.id,
          },
        });

        return { enrollment, payment };
      });

      // Send email
      try {
        await this.mailService.sendCoursePurchaseConfirmation(
          user.email,
          user.first_name || user.username,
          course.title,
          course.price,
        );
      } catch (emailError) {
        // Log email error but don't fail the purchase
        console.error(
          'Failed to send purchase confirmation email:',
          emailError,
        );
      }

      return {
        enrollment: result.enrollment,
        url: session.url,
        originalPrice: course.price,
        finalPrice: course.price,
        discountApplied: 0,
      };
    } catch (error) {
      console.error('Error in purchaseCourse:', error);

      // If it's a Prisma unique constraint error, provide a more user-friendly message
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('user_id') &&
        error.meta?.target?.includes('course_id')
      ) {
        throw new ConflictException('User is already enrolled in this course');
      }

      throw error;
    }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      // Verify webhook signature
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
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentSuccess(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'checkout.session.expired':
          await this.handlePaymentExpired(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new InternalServerErrorException('Failed to process webhook event');
    }
  }

  private async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    console.log('Processing successful payment for session:', session.id);

    try {
      if (!session.metadata?.userId || !session.metadata?.courseId) {
        throw new BadRequestException(
          'Missing user or course metadata in session',
        );
      }

      const userId = parseInt(session.metadata.userId);
      const courseId = parseInt(session.metadata.courseId);

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      // Update payment and enrollment in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Update payment status
        const payment = await prisma.payment.update({
          where: {
            stripe_payment_intent_id: session.payment_intent as string,
          },
          data: {
            status: PaymentStatus.SUCCEEDED,
            updated_at: new Date(),
          },
        });

        // Update enrollment status to ACTIVE
        const enrollment = await prisma.enrollment.update({
          where: {
            user_id_course_id: {
              user_id: userId,
              course_id: courseId,
            },
          },
          data: {
            status: 'ACTIVE',
            updated_at: new Date(),
          },
          include: {
            course: true,
            user: true,
          },
        });

        // Send confirmation email
        try {
          await this.mailService.sendCoursePurchaseConfirmation(
            enrollment.user.email,
            enrollment.user.first_name || enrollment.user.username,
            enrollment.course.title,
            payment.amount,
          );
        } catch (emailError) {
          console.error(
            'Failed to send enrollment confirmation email:',
            emailError,
          );
          // Don't throw error here as email failure shouldn't affect the transaction
        }

        return { payment, enrollment };
      });

      console.log('Payment and enrollment updated successfully');
    } catch (error) {
      console.error('Error handling payment success:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process successful payment',
      );
    }
  }

  private async handlePaymentExpired(session: Stripe.Checkout.Session) {
    console.log('Processing expired payment for session:', session.id);

    try {
      if (!session.metadata?.userId || !session.metadata?.courseId) {
        throw new BadRequestException(
          'Missing user or course metadata in session',
        );
      }

      const userId = parseInt(session.metadata.userId);
      const courseId = parseInt(session.metadata.courseId);

      await this.prisma.$transaction(async (prisma) => {
        // Update payment status
        await prisma.payment.update({
          where: {
            stripe_payment_intent_id: session.payment_intent as string,
          },
          data: {
            status: PaymentStatus.CANCELED,
            updated_at: new Date(),
          },
        });

        // Delete the pending enrollment
        await prisma.enrollment.deleteMany({
          where: {
            user_id: userId,
            course_id: courseId,
            status: 'PENDING',
          },
        });
      });

      console.log('Expired payment and enrollment cleaned up');
    } catch (error) {
      console.error('Error handling payment expiration:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process expired payment',
      );
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('Processing failed payment for intent:', paymentIntent.id);

    try {
      // Update payment status
      await this.prisma.payment.updateMany({
        where: {
          stripe_payment_intent_id: paymentIntent.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          updated_at: new Date(),
        },
      });

      console.log('Failed payment status updated');
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw new InternalServerErrorException(
        'Failed to process failed payment',
      );
    }
  }

  async verifyPayment(sessionId: string, courseId: number, userId: number) {
    try {
      console.log('Verifying payment:', { sessionId, courseId, userId });

      // Retrieve session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session:', session);

      if (!session) {
        console.error('Payment session not found');
        throw new NotFoundException('Payment session not found');
      }

      if (!session.metadata?.userId || !session.metadata?.courseId) {
        console.error('Missing metadata:', session.metadata);
        throw new BadRequestException(
          'Missing user or course metadata in session',
        );
      }

      // Verify session belongs to the user and course
      if (
        parseInt(session.metadata.userId) !== userId ||
        parseInt(session.metadata.courseId) !== courseId
      ) {
        console.error('Invalid session metadata:', {
          sessionUserId: session.metadata.userId,
          providedUserId: userId,
          sessionCourseId: session.metadata.courseId,
          providedCourseId: courseId,
        });
        throw new BadRequestException(
          'Invalid session for this user and course',
        );
      }

      // Get payment and enrollment from database
      const payment = await this.prisma.payment.findFirst({
        where: {
          stripe_session_id: sessionId,
          user_id: userId,
          reference_id: courseId,
          reference_type: 'COURSE',
        },
      });
      console.log('Found payment:', payment);

      if (!payment) {
        console.error('Payment record not found');
        throw new NotFoundException('Payment record not found');
      }

      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              image_url: true,
            },
          },
        },
      });
      console.log('Found enrollment:', enrollment);

      if (!enrollment) {
        console.error('Enrollment record not found');
        throw new NotFoundException('Enrollment record not found');
      }

      // Update payment and enrollment status based on session status
      if (session.payment_status === 'paid') {
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCEEDED,
              // completed_at: new Date(),
              updated_at: new Date(),
            },
          }),
          this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'ACTIVE',
              updated_at: new Date(),
            },
          }),
        ]);
      } else if (session.payment_status === 'unpaid') {
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              updated_at: new Date(),
            },
          }),
          this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'CANCELLED',
              updated_at: new Date(),
            },
          }),
        ]);
      }

      return {
        payment,
        enrollment,
        session_status: session.status,
        payment_status: session.payment_status,
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  // Get payment status
  async getPaymentStatus(sessionId: string, userId: number) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          stripe_session_id: sessionId,
          user_id: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Get Stripe session details
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      return {
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          reference_type: payment.reference_type,
          reference_id: payment.reference_id,
          created_at: payment.created_at,
          completed_at: payment.completed_at,
        },
        stripe_session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status,
          url: session.url,
        },
        user: payment.user,
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Utility method to check if user has access to course
  async checkCourseAccess(userId: number, courseId: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        user_id: userId,
        course_id: courseId,
        status: 'ACTIVE',
      },
    });

    return {
      hasAccess: !!enrollment,
      enrollment: enrollment || null,
    };
  }

  async getUserEnrolledCourses(
    userId: number,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    this.logger.log(`[getUserEnrolledCourses] Starting with userId: ${userId}`);
    this.logger.log(
      `[getUserEnrolledCourses] Options: ${JSON.stringify(options)}`,
    );

    try {
      // Verify user exists
      this.logger.log(`[getUserEnrolledCourses] Checking user: ${userId}`);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      this.logger.log(
        `[getUserEnrolledCourses] User found: ${JSON.stringify(user)}`,
      );

      if (!user) {
        this.logger.error(`[getUserEnrolledCourses] User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }

      // Build where clause
      const whereClause: any = {
        user_id: userId,
      };

      // Filter by enrollment status if provided
      if (options.status) {
        const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(options.status.toUpperCase())) {
          this.logger.error(
            `[getUserEnrolledCourses] Invalid status: ${options.status}`,
          );
          throw new BadRequestException(
            'Invalid status. Valid statuses: PENDING, ACTIVE, COMPLETED, CANCELLED',
          );
        }
        whereClause.status = options.status.toUpperCase();
      }
      this.logger.log(
        `[getUserEnrolledCourses] Where clause: ${JSON.stringify(whereClause)}`,
      );

      // Calculate pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      this.logger.log(
        `[getUserEnrolledCourses] Pagination: ${JSON.stringify({ page, limit, skip })}`,
      );

      try {
        // Get enrollments with course details
        this.logger.log('[getUserEnrolledCourses] Fetching enrollments...');
        const [enrollments, totalCount] = await Promise.all([
          this.prisma.enrollment.findMany({
            where: whereClause,
            include: {
              course: {
                include: {
                  instructor: {
                    select: {
                      id: true,
                      username: true,
                      first_name: true,
                      last_name: true,
                      profile_image_url: true,
                    },
                  },
                  categories: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
            skip,
            take: limit,
          }),
          this.prisma.enrollment.count({
            where: whereClause,
          }),
        ]);
        this.logger.log(
          `[getUserEnrolledCourses] Found ${enrollments.length} enrollments`,
        );
        this.logger.log(`[getUserEnrolledCourses] Total count: ${totalCount}`);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Format response
        const courses = enrollments.map((enrollment) => ({
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            enrolled_at: enrollment.created_at,
            progress: enrollment.progress || 0,
          },
          course: enrollment.course,
        }));

        // Get enrollment summary
        this.logger.log(
          '[getUserEnrolledCourses] Fetching enrollment summary...',
        );
        const enrollmentSummary = await this.prisma.enrollment.groupBy({
          by: ['status'],
          where: {
            user_id: userId,
          },
          _count: {
            status: true,
          },
        });

        const summary = enrollmentSummary.reduce(
          (acc, item) => {
            acc[item.status.toLowerCase()] = item._count.status;
            return acc;
          },
          {} as Record<string, number>,
        );

        const response = {
          courses,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit,
          },
          summary: {
            total: totalCount,
            active: summary.active || 0,
            completed: summary.completed || 0,
            pending: summary.pending || 0,
            cancelled: summary.cancelled || 0,
          },
        };
        this.logger.log(
          `[getUserEnrolledCourses] Success response: ${JSON.stringify(response)}`,
        );
        return response;
      } catch (dbError) {
        this.logger.error(
          `[getUserEnrolledCourses] Database error: ${dbError.message}`,
          dbError.stack,
        );
        throw new InternalServerErrorException(
          'Database error while fetching enrollments',
        );
      }
    } catch (error) {
      this.logger.error(
        `[getUserEnrolledCourses] Error: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch course enrollment',
      );
    }
  }

  // Additional helper method to get enrollment details for a specific course
  async getUserCourseEnrollment(userId: number, courseId: number) {
    console.log('Getting user course enrollment:', { userId, courseId });
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      console.log('Found user:', user);

      if (!user) {
        console.error('User not found:', userId);
        throw new NotFoundException('User not found');
      }

      // Verify course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      console.log('Found course:', course);

      if (!course) {
        console.error('Course not found:', courseId);
        throw new NotFoundException('Course not found');
      }

      console.log('Fetching enrollment details...');
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              duration_hours: true,
              level: true,
              image_url: true,
              instructor: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  username: true,
                  profile_image_url: true,
                },
              },
            },
          },
          payments: {
            where: {
              reference_type: 'COURSE',
              reference_id: courseId,
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
      });
      console.log('Found enrollment:', enrollment);

      if (!enrollment) {
        console.error(
          'Enrollment not found for user:',
          userId,
          'course:',
          courseId,
        );
        throw new NotFoundException('Enrollment not found');
      }

      const response = {
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress || 0,
          enrolled_at: enrollment.created_at,
          updated_at: enrollment.updated_at,
        },
        course: enrollment.course,
        payment: enrollment.payments[0] || null,
      };
      console.log('Returning response:', response);
      return response;
    } catch (error) {
      console.error('Error in getUserCourseEnrollment:', error);
      console.error('Error stack:', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch enrollment details',
      );
    }
  }

  async findByInstructor(instructorId: number, query: QueryCourseDto) {
    const {
      page = 1,
      limit = 10,
      search,
      min_price,
      max_price,
      category_ids,
      tag_ids,
      min_rating,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.CourseWhereInput = {
      instructor_id: instructorId,
      ...(min_price !== undefined && { price: { gte: min_price } }),
      ...(max_price !== undefined && { price: { lte: max_price } }),
      ...(category_ids?.length && {
        categories: { some: { id: { in: category_ids } } },
      }),
      ...(tag_ids?.length && {
        tags: { some: { id: { in: tag_ids } } },
      }),
      ...(min_rating && {
        reviews: { some: { rating: { gte: min_rating } } },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    // Build the orderBy clause
    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (sort_by === 'price') {
      orderBy.price = sort_order;
    } else if (sort_by === 'popularity') {
      orderBy.created_at = sort_order;
    } else {
      orderBy.created_at = sort_order;
    }

    const [total, courses] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          instructor: true,
          modules: {
            include: {
              lessons: true,
            },
          },
          categories: true,
          tags: true,
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
    ]);

    // Calculate average ratings
    const coursesWithStats = courses.map((course) => ({
      ...course,
      average_rating: course.reviews.length
        ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
          course.reviews.length
        : 0,
      enrollment_count: course._count.enrollments,
    }));

    return {
      data: coursesWithStats,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}
