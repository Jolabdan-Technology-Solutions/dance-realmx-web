import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import Stripe from 'stripe';
import { CoursesService } from './courses.service';
import { Course, Module, Lesson, UserRole } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { Roles } from '../auth/guards/roles.guard';
import { ResourceOwner } from '../auth/guards/resource-owner.guard';
import { SubscriptionRequired } from '../auth/guards/subscription.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ type: QueryCourseDto })
  @ApiResponse({ status: 200, description: 'Returns all courses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific course by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns the course' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Post('enroll-course/:id')
  @ApiOperation({ summary: 'Enroll a user in a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiBody({
    schema: { type: 'object', properties: { userId: { type: 'number' } } },
  })
  @ApiResponse({ status: 201, description: 'Enrollment successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  async enrollCourse(
    @Param('id') courseId: string,
    @Body() body: { userId: number },
  ) {
    return this.coursesService.purchaseCourse(body.userId, +courseId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }

  @Post(':courseId/modules')
  @ApiOperation({ summary: 'Create a new module for a course' })
  @ApiParam({ name: 'courseId', type: 'string', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        order: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @ResourceOwner('course')
  createModule(
    @Param('courseId') courseId: string,
    @Body()
    createModuleDto: {
      title: string;
      description: string;
      order: number;
    },
  ) {
    return this.coursesService.createModule({
      ...createModuleDto,
      course_id: +courseId,
    });
  }

  @Get(':courseId/modules')
  @ApiOperation({ summary: 'Get all modules for a course' })
  @ApiParam({ name: 'courseId', type: 'string', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns all modules' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @SubscriptionRequired()
  getModules(@Param('courseId') courseId: string) {
    return this.coursesService.getModules(+courseId);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'id', type: 'string', description: 'Module ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        order: { type: 'number', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: Partial<Module>,
  ) {
    return this.coursesService.updateModule(+id, updateModuleDto);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete a module' })
  @ApiParam({ name: 'id', type: 'string', description: 'Module ID' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  removeModule(@Param('id') id: string) {
    return this.coursesService.deleteModule(+id);
  }

  @Post('modules/:moduleId/lessons')
  @ApiOperation({ summary: 'Create a new lesson for a module' })
  @ApiParam({ name: 'moduleId', type: 'string', description: 'Module ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        video_url: { type: 'string', nullable: true },
        order: { type: 'number' },
      },
    },
  })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body()
    createLessonDto: {
      title: string;
      content: string;
      video_url?: string;
      order: number;
    },
  ) {
    return this.coursesService.createLesson({
      ...createLessonDto,
      module_id: +moduleId,
    });
  }

  @Patch('lessons/:id')
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lesson ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', nullable: true },
        content: { type: 'string', nullable: true },
        video_url: { type: 'string', nullable: true },
        order: { type: 'number', nullable: true },
      },
    },
  })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  updateLesson(
    @Param('id') id: string,
    @Body()
    updateLessonDto: {
      title?: string;
      content?: string;
      video_url?: string;
      order?: number;
    },
  ) {
    return this.coursesService.updateLesson(+id, updateLessonDto);
  }

  @Delete('lessons/:id')
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lesson ID' })
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  removeLesson(@Param('id') id: string) {
    return this.coursesService.deleteLesson(+id);
  }

  @Get('user/:userId/enrolled')
  @ApiOperation({ summary: 'Get courses enrolled by a specific user' })
  @UseGuards(JwtAuthGuard)
  async getUserEnrolledCourses(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.coursesService.getUserEnrolledCourses(userId, {
      status,
      page,
      limit,
    });
  }

  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get enrolled courses for the authenticated user' })
  @UseGuards(JwtAuthGuard)
  async getMyEnrolledCourses(
    @Req() req,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.coursesService.getUserEnrolledCourses(req.user.id, {
      status,
      page,
      limit,
    });
  }

  @Get('user/:userId/course/:courseId/enrollment')
  @ApiOperation({
    summary: 'Get enrollment details for a specific course and user',
  })
  @UseGuards(JwtAuthGuard)
  async getUserCourseEnrollment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.coursesService.getUserCourseEnrollment(userId, courseId);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<ExpressRequest>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException(
        'Raw body is required for webhook verification',
      );
    }
    return this.coursesService.handleStripeWebhook(req.rawBody, signature);
  }

  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify a payment manually' })
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body() verifyPaymentDto: { sessionId: string; courseId: number },
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.coursesService.verifyPayment(
      verifyPaymentDto.sessionId,
      verifyPaymentDto.courseId,
      req.user.id,
    );
  }

  // Check payment status
  @Get('payment/:sessionId/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Param('sessionId') sessionId: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.coursesService.getPaymentStatus(sessionId, req.user.id);
  }

  @Get('user/:userId/course/:courseId/access')
  @UseGuards(JwtAuthGuard)
  async checkCourseAccess(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: ExpressRequest & { user: { id: number; role: string } },
  ) {
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot check access for other users');
    }

    return this.coursesService.checkCourseAccess(userId, courseId);
  }
}
