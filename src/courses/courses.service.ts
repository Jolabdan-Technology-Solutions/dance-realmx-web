import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course, Module, Lesson } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    return this.prisma.course.create({
      data: createCourseDto,
      include: {
        instructor: true,
        modules: true,
      },
    });
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
      orderBy.enrollments = { _count: sort_order };
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

    if (!course) return null;

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
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        instructor: true,
        modules: true,
        categories: true,
        tags: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.course.delete({
      where: { id },
    });
  }

  // Module methods
  async createModule(data: {
    title: string;
    description: string;
    order: number;
    course_id: number;
  }) {
    return this.prisma.module.create({
      data,
      include: {
        course: true,
        lessons: true,
      },
    });
  }

  async updateModule(
    id: number,
    data: { title?: string; description?: string; order?: number },
  ) {
    return this.prisma.module.update({
      where: { id },
      data,
      include: {
        course: true,
        lessons: true,
      },
    });
  }

  async deleteModule(id: number) {
    return this.prisma.module.delete({
      where: { id },
    });
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

  async purchaseCourse(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!course || !user) {
      throw new Error('Course or user not found');
    }

    // Create purchase record
    const enrollment = await this.prisma.enrollment.create({
      data: {
        user_id: userId,
        course_id: courseId,
        status: 'ACTIVE',
      },
    });

    // Send purchase confirmation email
    await this.mailService.sendCoursePurchaseConfirmation(
      user.email,
      user.first_name || user.username,
      course.title,
      course.price,
    );

    return enrollment;
  }
}
