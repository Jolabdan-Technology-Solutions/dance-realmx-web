import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  Put,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentsService } from './enrollments.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RequestWithUser } from '../auth/interfaces/request.interface';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({
    status: 200,
    description: 'Returns all enrollments for the current user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEnrollments(@Req() req: RequestWithUser) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({ status: 200, description: 'Returns the enrollment details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  async getEnrollment(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.enrollmentsService.getEnrollmentById(req.user.id, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update enrollment status' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  async updateEnrollmentStatus(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.enrollmentsService.updateEnrollmentStatus(
      req.user.id,
      id,
      status,
    );
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get enrollment analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns enrollment statistics and trends',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEnrollmentAnalytics(@Req() req: RequestWithUser) {
    return this.enrollmentsService.getEnrollmentAnalytics(req.user.id);
  }

  @Get('courses/:courseId/progress')
  @ApiOperation({ summary: 'Get course progress' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed progress for a specific course',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  async getCourseProgress(
    @Req() req: RequestWithUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.enrollmentsService.getCourseProgress(req.user.id, courseId);
  }

  @Get('learning-path')
  @ApiOperation({ summary: 'Get learning path' })
  @ApiResponse({
    status: 200,
    description: "Returns the user's learning path with course progression",
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLearningPath(@Req() req: RequestWithUser) {
    return this.enrollmentsService.getLearningPath(req.user.id);
  }

  @Get('analytics/engagement')
  @ApiOperation({ summary: 'Get user engagement analytics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns user engagement metrics including course completion rates, learning streaks, and review statistics',
  })
  async getUserEngagementAnalytics(@Req() req: RequestWithUser) {
    return this.enrollmentsService.getUserEngagementAnalytics(req.user.id);
  }

  @Get('analytics/progress')
  @ApiOperation({ summary: 'Get learning progress analytics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns detailed learning progress metrics including course completion status and category-wise progress',
  })
  async getLearningProgressAnalytics(@Req() req: RequestWithUser) {
    return this.enrollmentsService.getLearningProgressAnalytics(req.user.id);
  }
}
