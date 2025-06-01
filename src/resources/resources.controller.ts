import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { Resource } from '@prisma/client';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('moduleId') moduleId?: string,
    @Query('lessonId') lessonId?: string,
  ) {
    if (courseId) {
      return this.resourcesService.findByCourse(+courseId);
    }
    if (moduleId) {
      return this.resourcesService.findByModule(+moduleId);
    }
    if (lessonId) {
      return this.resourcesService.findByLesson(+lessonId);
    }
    return this.resourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(+id);
  }

  @Post()
  create(
    @Body()
    createResourceDto: {
      title: string;
      description: string;
      type: string;
      url: string;
      course_id?: number;
      module_id?: number;
      lesson_id?: number;
    },
  ) {
    return this.resourcesService.create(createResourceDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: Partial<Resource>,
  ) {
    return this.resourcesService.update(+id, updateResourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourcesService.delete(+id);
  }
}
