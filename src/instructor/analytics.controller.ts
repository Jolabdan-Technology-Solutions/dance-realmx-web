import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum AnalyticsTimeframe {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export enum MetricType {
  REVENUE = 'revenue',
  USERS = 'users',
  COURSES = 'courses',
  ENROLLMENTS = 'enrollments',
  COMPLETIONS = 'completions',
  ENGAGEMENT = 'engagement',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(AnalyticsTimeframe)
  timeframe?: AnalyticsTimeframe = AnalyticsTimeframe.LAST_30_DAYS;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  instructor_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  course_id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;
}

export class MetricsQueryDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(MetricType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  metrics?: MetricType[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class EventTrackingDto {
  @IsString()
  @IsNotEmpty()
  event_name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  course_id?: number;

  @IsOptional()
  properties?: Record<string, any>;
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(query);
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getMetrics(@Query() query: MetricsQueryDto) {
    return this.analyticsService.getMetrics(query);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getUserAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserAnalytics(query);
  }

  @Get('courses')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getCoursePerformance(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCoursePerformance(query);
  }
}
