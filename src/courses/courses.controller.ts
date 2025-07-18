import {
  Controller,
  Get,
  Post,
  Body,
  Put,
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
  UnauthorizedException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { CoursesService } from './courses.service';
import type { Course, Module, Lesson } from '@prisma/client';
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
import { Logger } from '@nestjs/common';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { EnrollCourseDto } from './dto/enroll-course.dto';

@Controller('courses')
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ type: QueryCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Returns all courses',
    type: 'Course',
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RequireFeature(Feature.VIEW_COURSES)
  findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific course by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the course',
    type: 'Course',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.VIEW_COURSES)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: 'Course',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RequireFeature(Feature.CREATE_COURSES)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Post('enroll-course/:id')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @ApiOperation({ summary: 'Enroll a user in a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiBody({ type: EnrollCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Enrollment successful',
    type: 'Course',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.ENROLL_COURSES)
  async enrollCourse(
    @Param('id') courseId: string,
    @Body() enrollCourseDto: EnrollCourseDto,
  ) {
    return this.coursesService.purchaseCourse(
      enrollCourseDto.user_id,
      +courseId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: 'Course',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully',
    type: 'Course',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }

  @Post(':courseId/modules')
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @ApiOperation({ summary: 'Create a new module for a course' })
  @ApiParam({ name: 'courseId', type: 'string', description: 'Course ID' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: 'Module',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.MANAGE_COURSES)
  createModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.createModule({
      ...createModuleDto,
      course_id: +courseId,
    });
  }

  @Get(':courseId/modules')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Get all modules for a course' })
  @ApiParam({ name: 'courseId', type: 'string', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all modules',
    type: 'Module',
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  // @RequireFeature(Feature.VIEW_COURSES)
  @SubscriptionRequired()
  getModules(@Param('courseId') courseId: string) {
    return this.coursesService.getModules(+courseId);
  }

  @Put(':id/visibility')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Toggle course visibility' })
  @ApiParam({ name: 'id', type: 'string', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Course visibility toggled successfully',
    type: 'Course',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  toggleVisibility(@Param('id') id: string) {
    return this.coursesService.toggleVisibility(+id);
  }

  @Patch('modules/:id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'id', type: 'string', description: 'Module ID' })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: 'Module',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.coursesService.updateModule(+id, updateModuleDto);
  }

  @Delete('modules/:id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Delete a module' })
  @ApiParam({ name: 'id', type: 'string', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    type: 'Module',
  })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  removeModule(@Param('id') id: string) {
    return this.coursesService.deleteModule(+id);
  }

  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Create a new lesson for a module' })
  @ApiParam({ name: 'moduleId', type: 'string', description: 'Module ID' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    type: 'Lesson',
  })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson({
      ...createLessonDto,
      module_id: +moduleId,
    });
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lesson ID' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully',
    type: 'Lesson',
  })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(+id, updateLessonDto);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'id', type: 'string', description: 'Lesson ID' })
  @ApiResponse({
    status: 200,
    description: 'Lesson deleted successfully',
    type: 'Lesson',
  })
  // @RequireFeature(Feature.MANAGE_COURSES)
  @ResourceOwner('course')
  removeLesson(@Param('id') id: string) {
    return this.coursesService.deleteLesson(+id);
  }

  @Get('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Get all lessons for a module' })
  @ApiParam({ name: 'moduleId', type: 'string', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all lessons for the module',
    type: 'Lesson',
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  // @RequireFeature(Feature.VIEW_COURSES)
  @SubscriptionRequired()
  getLessonsByModule(@Param('moduleId') moduleId: string) {
    return this.coursesService.getLessonsByModule(+moduleId);
  }

  @Get('user/:userId/enrolled')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
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

  @Get('enrollment/me')
  @UseGuards(JwtAuthGuard)
  // @RequireFeature(Feature.VIEW_COURSES)
  @ApiOperation({ summary: 'Get enrolled courses for the authenticated user' })
  async getMyEnrolledCourses(
    @Req() req: Request & { user: { id: number } },
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    this.logger.debug('Getting my enrollments:', {
      userId: req.user?.id,
      status,
      page,
      limit,
    });
    if (!req.user?.id) {
      this.logger.error('User not found in request');
      throw new UnauthorizedException('User not authenticated');
    }
    return this.coursesService.getUserEnrolledCourses(req.user.id, {
      status,
      page,
      limit,
    });
  }

  @Get('user/:userId/course/:courseId/enrollment')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
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
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
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
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Verify a payment manually' })
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body() verifyPaymentDto: { sessionId: string; courseId: number },
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.coursesService.verifyPayment(
      verifyPaymentDto.sessionId,
      Number(verifyPaymentDto.courseId),
      req.user.id,
    );
  }

  // Check payment status
  @Get('payment/:sessionId/status')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Param('sessionId') sessionId: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.coursesService.getPaymentStatus(sessionId, req.user.id);
  }

  @Get('user/:userId/course/:courseId/access')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
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

  @Get('instructor/:instructorId')
  @ApiOperation({
    summary: 'Get all courses by instructor with filtering and pagination',
  })
  @ApiParam({
    name: 'instructorId',
    type: 'number',
    description: 'Instructor ID',
  })
  @ApiQuery({ type: QueryCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Returns all courses for the instructor',
  })
  findByInstructor(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Query() query: QueryCourseDto,
  ) {
    return this.coursesService.findByInstructor(instructorId, query);
  }

  @Get(':courseId/quizzes')
  @UseGuards(JwtAuthGuard, FeatureGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Get all quizzes for a course' })
  @ApiParam({ name: 'courseId', type: 'string', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all quizzes for the course',
    type: 'Quiz',
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RequireFeature(Feature.VIEW_COURSES)
  @SubscriptionRequired()
  getCourseQuizzes(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseQuizzes(+courseId);
  }
}
