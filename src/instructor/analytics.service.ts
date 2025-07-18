import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsQueryDto,
  MetricsQueryDto,
  EventTrackingDto,
  AnalyticsTimeframe,
  MetricType,
} from './analytics.controller';

export interface OverviewData {
  totalRevenue: number;
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  growthMetrics: {
    revenueGrowth: number;
    userGrowth: number;
    enrollmentGrowth: number;
  };
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    orders: number;
  }>;
  topPerformingCourses: Array<{
    courseId: number;
    courseName: string;
    revenue: number;
    enrollments: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetentionRate: number;
  usersByRole: Record<string, number>;
  userGrowthTrend: Array<{
    period: string;
    newUsers: number;
    totalUsers: number;
  }>;
}

export interface CoursePerformance {
  totalCourses: number;
  publishedCourses: number;
  averageRating: number;
  averageCompletionRate: number;
  courseMetrics: Array<{
    courseId: number;
    courseName: string;
    enrollments: number;
    completions: number;
    revenue: number;
    rating: number;
    completionRate: number;
  }>;
}

interface Period {
  start: Date;
  end: Date;
  label: string;
}

export interface MetricResult {
  total: number;
  byPeriod: Array<{
    period: string;
    [key: string]: any;
  }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    try {
      const { startDate, endDate } = this.getDateRange(query);
      this.logger.log(
        `Getting overview for period: ${startDate.toISOString()} to ${endDate.toISOString()}`,
      );

      const whereClause: any = {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (query.instructor_id) {
        whereClause.instructor_id = query.instructor_id;
      }

      // Get total revenue from payments
      const totalRevenueResult = await this.prisma.payment.aggregate({
        where: {
          ...whereClause,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });

      // Get total users
      const totalUsers = await this.prisma.user.count({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get total courses
      const totalCourses = await this.prisma.course.count({
        where: whereClause,
      });

      // Get total enrollments
      const totalEnrollments = await this.prisma.enrollment.count({
        where: whereClause,
      });

      // Calculate completion rate
      const completedEnrollments = await this.prisma.enrollment.count({
        where: {
          ...whereClause,
          completion_percentage: 100,
        },
      });

      const averageCompletionRate =
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0;

      // Calculate growth metrics (comparing with previous period)
      const previousPeriodStart = new Date(
        startDate.getTime() - (endDate.getTime() - startDate.getTime()),
      );
      const previousPeriodEnd = startDate;

      const previousRevenue = await this.prisma.payment.aggregate({
        where: {
          created_at: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });

      const previousUsers = await this.prisma.user.count({
        where: {
          created_at: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
      });

      const previousEnrollments = await this.prisma.enrollment.count({
        where: {
          created_at: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
      });

      const currentRevenue = totalRevenueResult._sum.amount || 0;
      const prevRevenue = previousRevenue._sum.amount || 0;

      const revenueGrowth =
        prevRevenue > 0
          ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
          : 0;
      const userGrowth =
        previousUsers > 0
          ? ((totalUsers - previousUsers) / previousUsers) * 100
          : 0;
      const enrollmentGrowth =
        previousEnrollments > 0
          ? ((totalEnrollments - previousEnrollments) / previousEnrollments) *
            100
          : 0;

      return {
        totalRevenue: currentRevenue,
        totalUsers,
        totalCourses,
        totalEnrollments,
        averageCompletionRate,
        growthMetrics: {
          revenueGrowth,
          userGrowth,
          enrollmentGrowth,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting overview: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getMetrics(
    query: MetricsQueryDto,
  ): Promise<Array<{ type: string; data: MetricResult }>> {
    const { startDate, endDate } = this.getDateRange(query);
    const results: Array<{ type: string; data: MetricResult }> = [];

    if (query.metrics?.includes(MetricType.REVENUE)) {
      const revenue = await this.getRevenueMetric(startDate, endDate, query);
      results.push({ type: 'revenue', data: revenue });
    }

    if (query.metrics?.includes(MetricType.USERS)) {
      const users = await this.getUserMetric(startDate, endDate, query);
      results.push({ type: 'users', data: users });
    }

    if (query.metrics?.includes(MetricType.ENROLLMENTS)) {
      const enrollments = await this.getEnrollmentMetric(
        startDate,
        endDate,
        query,
      );
      results.push({ type: 'enrollments', data: enrollments });
    }

    return results;
  }

  async getRevenueAnalytics(
    query: AnalyticsQueryDto,
  ): Promise<RevenueAnalytics> {
    const { startDate, endDate } = this.getDateRange(query);
    const revenueMetrics = await this.getRevenueMetric(
      startDate,
      endDate,
      query,
    );
    const topPerformingCourses = await this.getTopPerformingCourses(
      startDate,
      endDate,
      query,
    );

    return {
      totalRevenue: revenueMetrics.total,
      averageOrderValue:
        revenueMetrics.total > 0 && revenueMetrics.byPeriod.length > 0
          ? revenueMetrics.total /
            revenueMetrics.byPeriod.reduce((sum, p) => sum + p.orders, 0)
          : 0,
      revenueByPeriod: revenueMetrics.byPeriod.map((p) => ({
        period: p.period,
        revenue: p.revenue,
        orders: p.orders || 0,
      })),
      topPerformingCourses,
    };
  }

  async getUserAnalytics(query: AnalyticsQueryDto): Promise<UserAnalytics> {
    const { startDate, endDate } = this.getDateRange(query);
    const userMetrics = await this.getUserMetric(startDate, endDate, query);
    const userGrowthTrend = await this.getUserGrowthTrend(startDate, endDate);

    // Calculate active users (example: users with at least one enrollment)
    const activeUsers = await this.prisma.user.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        enrollments: { some: {} }, // Users with at least one enrollment
      },
    });

    // Calculate new users
    const newUsers = userMetrics.byPeriod.reduce((sum, p) => sum + p.users, 0);

    // Calculate user retention rate (placeholder - requires more complex logic)
    const userRetentionRate = 0;

    // Get users by role (placeholder - requires more complex logic)
    const usersByRole: Record<string, number> = {};

    return {
      totalUsers: userMetrics.total,
      activeUsers,
      newUsers,
      userRetentionRate,
      usersByRole,
      userGrowthTrend,
    };
  }

  async getCoursePerformance(
    query: AnalyticsQueryDto,
  ): Promise<CoursePerformance> {
    const { startDate, endDate } = this.getDateRange(query);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        course: {
          instructor_id: query.instructor_id,
        },
      },
      include: {
        course: true,
      },
    });

    const courses = await this.prisma.course.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        instructor_id: query.instructor_id,
      },
    });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.is_published).length;

    const courseMetrics = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.course_id === course.id,
      );
      const totalCourseEnrollments = courseEnrollments.length;
      const completedCourseEnrollments = courseEnrollments.filter(
        (e) => e.completion_percentage === 100,
      ).length;
      const completionRate =
        totalCourseEnrollments > 0
          ? (completedCourseEnrollments / totalCourseEnrollments) * 100
          : 0;
      const courseRevenue = courseEnrollments.reduce(
        (sum, e) => sum + (e.course?.price || 0),
        0,
      ); // Assuming price is on course

      return {
        courseId: course.id,
        courseName: course.title,
        enrollments: totalCourseEnrollments,
        completions: completedCourseEnrollments,
        revenue: courseRevenue,
        rating: course.average_rating || 0, // Assuming average_rating on course
        completionRate,
      };
    });

    const averageRating =
      courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.average_rating || 0), 0) /
          courses.length
        : 0;

    const averageCompletionRate =
      totalCourses > 0
        ? courseMetrics.reduce((sum, c) => sum + c.completionRate, 0) /
          totalCourses
        : 0;

    return {
      totalCourses,
      publishedCourses,
      averageRating,
      averageCompletionRate,
      courseMetrics,
    };
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

  groupRevenueByPeriod(payments: any[], startDate: Date, endDate: Date) {
    const periods = this.generatePeriods(startDate, endDate);
    return periods.map((period: Period) => ({
      period: period.label,
      revenue: payments
        .filter((payment) =>
          this.isDateInPeriod(payment.created_at, period.start, period.end),
        )
        .reduce((sum, payment) => sum + payment.amount, 0),
      orders: payments.filter((payment) =>
        this.isDateInPeriod(payment.created_at, period.start, period.end),
      ).length,
    }));
  }

  groupUsersByPeriod(users: any[], startDate: Date, endDate: Date) {
    const periods = this.generatePeriods(startDate, endDate);
    return periods.map((period: Period) => ({
      period: period.label,
      users: users.filter((user) =>
        this.isDateInPeriod(user.created_at, period.start, period.end),
      ).length,
    }));
  }

  groupEnrollmentsByPeriod(enrollments: any[], startDate: Date, endDate: Date) {
    const periods = this.generatePeriods(startDate, endDate);
    return periods.map((period: Period) => ({
      period: period.label,
      enrollments: enrollments.filter((enrollment) =>
        this.isDateInPeriod(enrollment.created_at, period.start, period.end),
      ).length,
    }));
  }

  async getTopPerformingCourses(
    startDate: Date,
    endDate: Date,
    query: MetricsQueryDto,
  ): Promise<
    Array<{
      courseId: number;
      courseName: string;
      revenue: number;
      enrollments: number;
    }>
  > {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        course: true,
      },
    });

    type CoursePerformance = {
      courseId: number;
      courseName: string;
      enrollments: number;
      revenue: number;
    };

    const coursePerformance = enrollments.reduce(
      (acc: Record<number, CoursePerformance>, enrollment) => {
        const courseId = enrollment.course_id;
        if (!acc[courseId]) {
          acc[courseId] = {
            courseId,
            courseName: enrollment.course.title,
            enrollments: 0,
            revenue: 0,
          };
        }
        acc[courseId].enrollments++;
        acc[courseId].revenue += enrollment.course?.price || 0;
        return acc;
      },
      {},
    );

    const performanceArray = Object.values(
      coursePerformance,
    ) as CoursePerformance[];
    return performanceArray
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, query.limit || 10);
  }

  async getUserGrowthTrend(startDate: Date, endDate: Date) {
    const users = await this.prisma.user.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    const periods = this.generatePeriods(startDate, endDate);
    return periods.map((period: Period) => ({
      period: period.label,
      newUsers: users.filter((user) =>
        this.isDateInPeriod(user.created_at, period.start, period.end),
      ).length,
      totalUsers: users.filter((user) => user.created_at <= period.end).length,
    }));
  }

  private generatePeriods(startDate: Date, endDate: Date): Period[] {
    const periods: Period[] = [];
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 7) {
      // Daily periods
      for (let i = 0; i < daysDiff; i++) {
        const periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + i);
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        periods.push({
          start: periodStart,
          end: periodEnd,
          label: periodStart.toISOString().split('T')[0],
        });
      }
    } else if (daysDiff <= 30) {
      // Weekly periods
      for (let i = 0; i < Math.ceil(daysDiff / 7); i++) {
        const periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + i * 7);
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        periods.push({
          start: periodStart,
          end: periodEnd,
          label: `Week ${i + 1}`,
        });
      }
    } else {
      // Monthly periods
      for (let i = 0; i < Math.ceil(daysDiff / 30); i++) {
        const periodStart = new Date(startDate);
        periodStart.setMonth(periodStart.getMonth() + i);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periods.push({
          start: periodStart,
          end: periodEnd,
          label: periodStart.toLocaleString('default', {
            month: 'short',
            year: 'numeric',
          }),
        });
      }
    }

    return periods;
  }

  private isDateInPeriod(
    date: Date,
    periodStart: Date,
    periodEnd: Date,
  ): boolean {
    return date >= periodStart && date < periodEnd;
  }

  private async getRevenueMetric(
    startDate: Date,
    endDate: Date,
    query: MetricsQueryDto,
  ): Promise<MetricResult> {
    const payments = await this.prisma.payment.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const byPeriod = this.groupRevenueByPeriod(payments, startDate, endDate);

    return {
      total,
      byPeriod,
    };
  }

  private async getUserMetric(
    startDate: Date,
    endDate: Date,
    query: MetricsQueryDto,
  ): Promise<MetricResult> {
    const users = await this.prisma.user.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const total = users.length;
    const byPeriod = this.groupUsersByPeriod(users, startDate, endDate);

    return {
      total,
      byPeriod,
    };
  }

  private async getEnrollmentMetric(
    startDate: Date,
    endDate: Date,
    query: MetricsQueryDto,
  ): Promise<MetricResult> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const total = enrollments.length;
    const byPeriod = this.groupEnrollmentsByPeriod(
      enrollments,
      startDate,
      endDate,
    );

    return {
      total,
      byPeriod,
    };
  }
}
