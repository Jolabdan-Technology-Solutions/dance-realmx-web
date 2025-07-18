import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsQueryDto,
  MetricsQueryDto,
  EventTrackingDto,
  AnalyticsTimeframe,
  MetricType,
} from './analytics.controller';
import {
  OverviewData,
  RevenueAnalytics,
  UserAnalytics,
  CoursePerformance,
  MetricResult,
} from './analytics.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstructorService {
  private readonly logger = new Logger(InstructorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private getDateRange(query: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (
      query.timeframe === AnalyticsTimeframe.CUSTOM &&
      query.start_date &&
      query.end_date
    ) {
      startDate = new Date(query.start_date);
      endDate = new Date(query.end_date);
    } else {
      switch (query.timeframe) {
        case AnalyticsTimeframe.LAST_7_DAYS:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.LAST_30_DAYS:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.LAST_90_DAYS:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.LAST_YEAR:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { startDate, endDate };
  }

  async getOverview(query: AnalyticsQueryDto): Promise<OverviewData> {
    return this.analyticsService.getOverview(query);
  }

  async getMetrics(query: MetricsQueryDto): Promise<any[]> {
    return this.analyticsService.getMetrics(query);
  }

  async getRevenueAnalytics(
    query: AnalyticsQueryDto,
  ): Promise<RevenueAnalytics> {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  async getUserAnalytics(query: AnalyticsQueryDto): Promise<UserAnalytics> {
    return this.analyticsService.getUserAnalytics(query);
  }

  async getCoursePerformance(
    query: AnalyticsQueryDto,
  ): Promise<CoursePerformance> {
    return this.analyticsService.getCoursePerformance(query);
  }

  async getInstructorAnalytics(
    instructorId: number,
    query: AnalyticsQueryDto,
  ): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query);

    // Verify instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
      include: { courses: true },
    });

    if (!instructor) {
      return null; // Or throw a NotFoundException
    }

    // Get courses belonging to this instructor
    const instructorCourses = await this.prisma.course.findMany({
      where: {
        instructor_id: instructorId,
        created_at: { gte: startDate, lte: endDate },
      },
    });

    // Get enrollments for these courses
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        course_id: { in: instructorCourses.map((c) => c.id) },
        created_at: { gte: startDate, lte: endDate },
      },
      include: { course: true, user: true },
    });

    // Get payments for these courses
    const payments = await this.prisma.payment.findMany({
      where: {
        reference_id: { in: instructorCourses.map((c) => c.id) },
        reference_type: 'COURSE',
        created_at: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    });

    // Calculate total revenue for instructor
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate total enrollments for instructor
    const totalEnrollments = enrollments.length;

    // Calculate total courses for instructor
    const totalCourses = instructorCourses.length;

    // Placeholder for more detailed instructor-specific analytics
    return {
      instructorId,
      totalRevenue,
      totalEnrollments,
      totalCourses,
      // ... more metrics specific to instructor ...
    };
  }

  async getCourseAnalytics(
    courseId: number,
    query: AnalyticsQueryDto,
  ): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query);

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return null; // Or throw a NotFoundException
    }

    // Get enrollments for this course
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        course_id: courseId,
        created_at: { gte: startDate, lte: endDate },
      },
      include: { user: true },
    });

    // Get payments for this course
    const payments = await this.prisma.payment.findMany({
      where: {
        reference_id: courseId,
        reference_type: 'COURSE',
        created_at: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    });

    // Calculate total revenue for course
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate total enrollments for course
    const totalEnrollments = enrollments.length;

    // Calculate completion rate for course
    const completedEnrollments = enrollments.filter(
      (e) => e.completion_percentage === 100,
    ).length;
    const completionRate =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    // Placeholder for more detailed course-specific analytics
    return {
      courseId,
      courseName: course.title,
      totalRevenue,
      totalEnrollments,
      completionRate,
      // ... more metrics specific to course ...
    };
  }

  async exportAnalytics(
    query: AnalyticsQueryDto,
    format: string = 'json',
  ): Promise<any> {
    try {
      // For simplicity, this example just returns the overview data as JSON.
      // In a real application, you would fetch the relevant data based on the query
      // and format it according to the requested format (e.g., CSV, PDF).
      const overviewData = await this.getOverview(query);

      if (format === 'csv') {
        // Example: Convert overviewData to CSV string
        const headers = Object.keys(overviewData).join(',');
        const values = Object.values(overviewData).join(',');
        return `${headers}\n${values}`;
      } else {
        return overviewData;
      }
    } catch (error) {
      this.logger.error(
        `Error exporting analytics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async create(createInstructorDto: CreateInstructorDto) {
    const hashedPassword = await bcrypt.hash(createInstructorDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createInstructorDto,
        password: hashedPassword,
        role: [UserRole.INSTRUCTOR],
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { role: { has: UserRole.INSTRUCTOR_ADMIN } }, // Check if array contains INSTRUCTOR_ADMIN
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        // bio: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: number) {
    const instructor = await this.prisma.user.findFirst({
      where: {
        id,
        OR: [{ role: { has: UserRole.INSTRUCTOR_ADMIN } }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        profile: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        courses: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            image_url: true,
            created_at: true,
          },
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    return instructor;
  }

  async update(id: number, updateInstructorDto: UpdateInstructorDto) {
    const instructor = await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateInstructorDto,
    });
  }

  async remove(id: number) {
    const instructor = await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }
}

// async getInstructorAnalytics(instructorId: number, query: AnalyticsQueryDto): Promise<any> {
//   try {
//     const { startDate, endDate } = this.getDateRange(query);

//     // Verify instructor exists
//     const instructor = await this.prisma.user.findUnique({
//       where: { id: instructorId },
//       include: { courses: true },
//     });

//     if (!instructor) {
//       return null;
//     }

//     const courseIds = instructor.courses.map(course => course.id);

//     // Get instructor
