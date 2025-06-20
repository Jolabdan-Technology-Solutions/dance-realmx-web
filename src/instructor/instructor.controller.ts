import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { UserRole } from '@prisma/client';

import { InstructorService } from './instructor.service';
import {
  AnalyticsQueryDto,
  MetricsQueryDto,
  EventTrackingDto,
  AnalyticsTimeframe,
  MetricType,
} from './analytics.controller';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorController {
  private readonly logger = new Logger(InstructorController.name);

  constructor(private readonly instructorService: InstructorService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createInstructorDto: CreateInstructorDto) {
    try {
      const instructor =
        await this.instructorService.create(createInstructorDto);
      return {
        message: 'Instructor created successfully',
        data: instructor,
      };
    } catch (error) {
      this.logger.error(
        `Error creating instructor: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create instructor');
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async findAll() {
    try {
      const instructors = await this.instructorService.findAll();
      return {
        message: 'Instructors retrieved successfully',
        data: instructors,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving instructors: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve instructors');
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async findOne(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Instructor ID must be a valid number'),
      }),
    )
    id: number,
  ) {
    try {
      const instructor = await this.instructorService.findOne(id);
      return {
        message: 'Instructor retrieved successfully',
        data: instructor,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving instructor: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve instructor');
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Instructor ID must be a valid number'),
      }),
    )
    id: number,
    @Body() updateInstructorDto: UpdateInstructorDto,
  ) {
    try {
      const instructor = await this.instructorService.update(
        id,
        updateInstructorDto,
      );
      return {
        message: 'Instructor updated successfully',
        data: instructor,
      };
    } catch (error) {
      this.logger.error(
        `Error updating instructor: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update instructor');
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Instructor ID must be a valid number'),
      }),
    )
    id: number,
  ) {
    try {
      const instructor = await this.instructorService.remove(id);
      return {
        message: 'Instructor deleted successfully',
        data: instructor,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting instructor: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete instructor');
    }
  }

  // Validate date range
  private validateDateRange(startDate?: string, endDate?: string): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new BadRequestException('start_date cannot be after end_date');
      }

      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff > 365) {
        throw new BadRequestException('Date range cannot exceed 365 days');
      }
    }
  }

  // Validate custom timeframe requirements
  private validateCustomTimeframe(query: AnalyticsQueryDto): void {
    if (query.timeframe === AnalyticsTimeframe.CUSTOM) {
      if (!query.start_date || !query.end_date) {
        throw new BadRequestException(
          'start_date and end_date are required when timeframe is "custom"',
        );
      }
    }
  }

  @Get('analytics/overview')
  @Roles(UserRole.INSTRUCTOR_ADMIN)
  async getOverview(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting analytics overview with query: ${JSON.stringify(query)}`,
      );

      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const overview = await this.instructorService.getOverview(query);

      if (!overview) {
        throw new NotFoundException(
          'Analytics data not found for the specified parameters',
        );
      }

      return {
        message: 'Analytics overview retrieved successfully',
        data: overview,
      };
    } catch (error) {
      this.logger.error(
        `Error getting overview: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve analytics overview',
      );
    }
  }

  @Get('analytics/metrics')
  @Roles(UserRole.INSTRUCTOR_ADMIN)
  async getMetrics(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: MetricsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting analytics metrics with query: ${JSON.stringify(query)}`,
      );

      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const metrics = await this.instructorService.getMetrics(query);

      if (!metrics || metrics.length === 0) {
        throw new NotFoundException(
          'Analytics metrics not found for the specified parameters',
        );
      }

      return {
        message: 'Analytics metrics retrieved successfully',
        data: metrics,
      };
    } catch (error) {
      this.logger.error(`Error getting metrics: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve analytics metrics',
      );
    }
  }

  @Get('analytics/revenue')
  @Roles(UserRole.INSTRUCTOR_ADMIN)
  async getRevenueAnalytics(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting revenue analytics with query: ${JSON.stringify(query)}`,
      );

      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const revenueAnalytics =
        await this.instructorService.getRevenueAnalytics(query);

      if (!revenueAnalytics) {
        throw new NotFoundException(
          'Revenue analytics data not found for the specified parameters',
        );
      }

      return {
        message: 'Revenue analytics retrieved successfully',
        data: revenueAnalytics,
      };
    } catch (error) {
      this.logger.error(
        `Error getting revenue analytics: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve revenue analytics',
      );
    }
  }

  @Get('analytics/users')
  @Roles(UserRole.INSTRUCTOR_ADMIN)
  async getUserAnalytics(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting user analytics with query: ${JSON.stringify(query)}`,
      );

      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const userAnalytics =
        await this.instructorService.getUserAnalytics(query);

      if (!userAnalytics) {
        throw new NotFoundException(
          'User analytics data not found for the specified parameters',
        );
      }

      return {
        message: 'User analytics retrieved successfully',
        data: userAnalytics,
      };
    } catch (error) {
      this.logger.error(
        `Error getting user analytics: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve user analytics',
      );
    }
  }

  @Get('analytics/courses')
  @Roles(UserRole.INSTRUCTOR_ADMIN)
  async getCoursePerformance(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting course performance with query: ${JSON.stringify(query)}`,
      );

      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const coursePerformance =
        await this.instructorService.getCoursePerformance(query);

      if (!coursePerformance) {
        throw new NotFoundException(
          'Course performance data not found for the specified parameters',
        );
      }

      return {
        message: 'Course performance retrieved successfully',
        data: coursePerformance,
      };
    } catch (error) {
      this.logger.error(
        `Error getting course performance: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve course performance',
      );
    }
  }

  @Get('analytics/instructor/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getInstructorAnalytics(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Instructor ID must be a valid number'),
      }),
    )
    instructorId: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting analytics for instructor ${instructorId} with query: ${JSON.stringify(query)}`,
      );
      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const analytics = await this.instructorService.getInstructorAnalytics(
        instructorId,
        query,
      );

      if (!analytics) {
        throw new NotFoundException(
          `Analytics data not found for instructor ${instructorId}`,
        );
      }

      return {
        message: `Analytics for instructor ${instructorId} retrieved successfully`,
        data: analytics,
      };
    } catch (error) {
      this.logger.error(
        `Error getting instructor analytics: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve instructor analytics',
      );
    }
  }

  @Get('analytics/course/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async getCourseAnalytics(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Course ID must be a valid number'),
      }),
    )
    courseId: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
  ) {
    try {
      this.logger.log(
        `Getting analytics for course ${courseId} with query: ${JSON.stringify(query)}`,
      );
      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const analytics = await this.instructorService.getCourseAnalytics(
        courseId,
        query,
      );

      if (!analytics) {
        throw new NotFoundException(
          `Analytics data not found for course ${courseId}`,
        );
      }

      return {
        message: `Analytics for course ${courseId} retrieved successfully`,
        data: analytics,
      };
    } catch (error) {
      this.logger.error(
        `Error getting course analytics: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve course analytics',
      );
    }
  }

  @Get('analytics/export')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR_ADMIN)
  async exportAnalytics(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AnalyticsQueryDto,
    @Query('format') format: string = 'json',
  ) {
    try {
      this.logger.log(
        `Exporting analytics with query: ${JSON.stringify(query)} and format: ${format}`,
      );
      this.validateCustomTimeframe(query);
      this.validateDateRange(query.start_date, query.end_date);

      const exportData = await this.instructorService.exportAnalytics(
        query,
        format,
      );

      if (!exportData) {
        throw new NotFoundException(
          'Analytics export data not found for the specified parameters',
        );
      }

      return {
        message: 'Analytics exported successfully',
        data: exportData,
        format,
      };
    } catch (error) {
      this.logger.error(
        `Error exporting analytics: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to export analytics');
    }
  }
}
