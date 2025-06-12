import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async getUserEnrollments(userId: number) {
    return this.prisma.enrollment.findMany({
      where: { user_id: userId },
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
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });
  }

  async getEnrollmentById(userId: number, enrollmentId: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        user_id: userId,
      },
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
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async updateEnrollmentStatus(
    userId: number,
    enrollmentId: number,
    status: string,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        user_id: userId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new BadRequestException('Invalid enrollment status');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
  }

  async getEnrollmentAnalytics(userId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;
    const completedEnrollments = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;

    // Calculate total lessons and completed lessons
    const totalLessons = enrollments.reduce((acc, enrollment) => {
      return (
        acc +
        enrollment.course.modules.reduce((moduleAcc, module) => {
          return moduleAcc + module.lessons.length;
        }, 0)
      );
    }, 0);

    // Get enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEnrollments = await this.prisma.enrollment.groupBy({
      by: ['created_at'],
      where: {
        user_id: userId,
        created_at: {
          gte: sixMonthsAgo,
        },
      },
      _count: true,
    });

    // Get course category distribution
    const categoryDistribution = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            categories: true,
          },
        },
      },
    });

    const categoryStats = categoryDistribution.reduce((acc, enrollment) => {
      enrollment.course.categories.forEach((category) => {
        acc[category.name] = (acc[category.name] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      overview: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalLessons,
      },
      trends: {
        monthlyEnrollments: monthlyEnrollments.map((e) => ({
          month: e.created_at,
          count: e._count,
        })),
      },
      categoryDistribution: categoryStats,
    };
  }

  async getCourseProgress(userId: number, courseId: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        user_id: userId,
        course_id: courseId,
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const totalLessons = enrollment.course.modules.reduce((acc, module) => {
      return acc + module.lessons.length;
    }, 0);

    // For now, we'll assume completed lessons based on enrollment status
    // In a real implementation, you would track completed lessons separately
    const completedLessons =
      enrollment.status === 'COMPLETED' ? totalLessons : 0;

    // Calculate completion percentage
    const completionPercentage = Math.round(
      (completedLessons / totalLessons) * 100,
    );

    return {
      courseId,
      courseTitle: enrollment.course.title,
      status: enrollment.status,
      progress: {
        totalLessons,
        completedLessons,
        completionPercentage,
      },
      lastAccessed: enrollment.updated_at,
    };
  }

  async getLearningPath(userId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            categories: true,
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return enrollments.map((enrollment) => ({
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      categories: enrollment.course.categories.map((c) => c.name),
      difficultyLevel: enrollment.course.difficulty_level,
      enrolledAt: enrollment.created_at,
      status: enrollment.status,
      progress: {
        totalModules: enrollment.course.modules.length,
        totalLessons: enrollment.course.modules.reduce((acc, module) => {
          return acc + module.lessons.length;
        }, 0),
      },
    }));
  }

  async getUserEngagementAnalytics(userId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
            reviews: true,
          },
        },
      },
    });

    // Calculate engagement metrics
    const totalCourses = enrollments.length;
    const activeCourses = enrollments.filter(
      (e) => e.status === 'ACTIVE',
    ).length;
    const completedCourses = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;

    // Calculate average course completion time
    const completionTimes = enrollments
      .filter((e) => e.status === 'COMPLETED')
      .map((e) => {
        const created = new Date(e.created_at);
        const updated = new Date(e.updated_at);
        return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // in days
      });

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    // Get learning streak (consecutive days of activity)
    const activityDates = enrollments.map((e) => e.updated_at);
    const streak = this.calculateStreak(activityDates);

    // Get course difficulty distribution
    const difficultyDistribution = enrollments.reduce((acc, enrollment) => {
      const level = enrollment.course.difficulty_level;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // Get review statistics
    const reviewStats = enrollments.reduce(
      (acc, enrollment) => {
        const courseReviews = enrollment.course.reviews;
        const userReview = courseReviews.find((r) => r.user_id === userId);

        if (userReview) {
          acc.totalReviews++;
          acc.averageRating =
            (acc.averageRating * (acc.totalReviews - 1) + userReview.rating) /
            acc.totalReviews;
        }
        return acc;
      },
      { totalReviews: 0, averageRating: 0 },
    );

    return {
      overview: {
        totalCourses,
        activeCourses,
        completedCourses,
        completionRate:
          totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
      },
      engagement: {
        currentStreak: streak,
        averageCompletionTime: Math.round(avgCompletionTime * 10) / 10, // Round to 1 decimal
        lastActivity:
          activityDates.length > 0
            ? Math.max(...activityDates.map((d) => d.getTime()))
            : null,
      },
      learning: {
        difficultyDistribution,
        reviewStats,
      },
    };
  }

  async getLearningProgressAnalytics(userId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
            categories: true,
          },
        },
      },
    });

    // Calculate progress metrics
    const progressMetrics = enrollments.map((enrollment) => {
      const totalLessons = enrollment.course.modules.reduce((acc, module) => {
        return acc + module.lessons.length;
      }, 0);

      const completedLessons =
        enrollment.status === 'COMPLETED' ? totalLessons : 0;
      const progressPercentage =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        categories: enrollment.course.categories.map((c) => c.name),
        progress: {
          totalLessons,
          completedLessons,
          progressPercentage: Math.round(progressPercentage * 10) / 10,
        },
        lastAccessed: enrollment.updated_at,
      };
    });

    // Calculate category-wise progress
    const categoryProgress = progressMetrics.reduce((acc, course) => {
      course.categories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = {
            totalCourses: 0,
            completedCourses: 0,
            averageProgress: 0,
          };
        }
        acc[category].totalCourses++;
        if (course.progress.progressPercentage === 100) {
          acc[category].completedCourses++;
        }
        acc[category].averageProgress =
          (acc[category].averageProgress * (acc[category].totalCourses - 1) +
            course.progress.progressPercentage) /
          acc[category].totalCourses;
      });
      return acc;
    }, {});

    return {
      courseProgress: progressMetrics,
      categoryProgress,
      overallProgress: {
        totalCourses: progressMetrics.length,
        completedCourses: progressMetrics.filter(
          (c) => c.progress.progressPercentage === 100,
        ).length,
        averageProgress:
          progressMetrics.reduce(
            (acc, course) => acc + course.progress.progressPercentage,
            0,
          ) / progressMetrics.length,
      },
    };
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = dates
      .map((d) => new Date(d))
      .map((d) => {
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = today;

    for (const date of sortedDates) {
      const diffDays = Math.floor(
        (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        // Same day, continue streak
        continue;
      } else if (diffDays === 1) {
        // Consecutive day
        streak++;
        currentDate = date;
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }
}
