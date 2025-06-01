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
} from '@nestjs/common';
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

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @SubscriptionRequired()
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Post()
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }

  // Module endpoints
  @Post(':courseId/modules')
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
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

  @Patch('modules/:id')
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: Partial<Module>,
  ) {
    return this.coursesService.updateModule(+id, updateModuleDto);
  }

  @Delete('modules/:id')
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  removeModule(@Param('id') id: string) {
    return this.coursesService.deleteModule(+id);
  }

  // Lesson endpoints
  @Post('modules/:moduleId/lessons')
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
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ResourceOwner('course')
  removeLesson(@Param('id') id: string) {
    return this.coursesService.deleteLesson(+id);
  }
}
