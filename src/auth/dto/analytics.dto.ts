import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  total: number;

  @ApiProperty({ description: 'Number of active users' })
  active: number;

  @ApiProperty({ description: 'Number of inactive users' })
  inactive: number;

  @ApiProperty({
    description: 'Number of users by role',
    example: { ADMIN: 5, INSTRUCTOR: 20, STUDENT: 100 },
  })
  byRole: Record<string, number>;

  @ApiProperty({
    description: 'Number of users by subscription tier',
    example: { FREE: 50, SILVER: 30, GOLD: 20, PLATINUM: 10 },
  })
  byTier: Record<string, number>;

  @ApiProperty({
    description: 'Number of users by account type',
    example: { INSTRUCTOR: 20, SELLER: 10, NONE: 100 },
  })
  byAccountType: Record<string, number>;
}

export class RevenueDto {
  @ApiProperty({ description: 'Total revenue from subscriptions' })
  subscriptions: number;

  @ApiProperty({ description: 'Total revenue from course sales' })
  courses: number;

  @ApiProperty({ description: 'Total revenue from resource sales' })
  resources: number;

  @ApiProperty({ description: 'Total revenue across all sources' })
  total: number;
}

export class MonthlyGrowthDto {
  @ApiProperty({ description: 'Month of the growth data' })
  month: Date;

  @ApiProperty({ description: 'Number of new users in this month' })
  newUsers: number;
}

export class GrowthDto {
  @ApiProperty({
    type: [MonthlyGrowthDto],
    description: 'Monthly user growth data',
  })
  monthly: MonthlyGrowthDto[];
}

export class UserAnalyticsResponseDto {
  @ApiProperty({ type: UserStatsDto })
  userStats: UserStatsDto;

  @ApiProperty({ type: RevenueDto })
  revenue: RevenueDto;

  @ApiProperty({ type: GrowthDto })
  growth: GrowthDto;
}

export class InstructorOverviewDto {
  @ApiProperty({ description: 'Total number of instructors' })
  total: number;

  @ApiProperty({ description: 'Number of active instructors' })
  active: number;

  @ApiProperty({ description: 'Number of inactive instructors' })
  inactive: number;
}

export class InstructorCourseStatsDto {
  @ApiProperty({ description: 'Total number of courses by the instructor' })
  totalCourses: number;

  @ApiProperty({ description: "Average price of instructor's courses" })
  averagePrice: number;
}

export class InstructorPerformanceDto {
  @ApiProperty({
    description: 'Revenue per instructor',
    example: { '1': 1000, '2': 2000 },
  })
  revenue: Record<string, number>;

  @ApiProperty({
    description: 'Course statistics per instructor',
    example: { '1': { totalCourses: 5, averagePrice: 50 } },
  })
  courses: Record<string, InstructorCourseStatsDto>;

  @ApiProperty({
    description: 'Number of enrollments per instructor',
    example: { '1': 100, '2': 200 },
  })
  enrollments: Record<string, number>;
}

export class InstructorAnalyticsResponseDto {
  @ApiProperty({ type: InstructorOverviewDto })
  overview: InstructorOverviewDto;

  @ApiProperty({ type: InstructorPerformanceDto })
  performance: InstructorPerformanceDto;
}
