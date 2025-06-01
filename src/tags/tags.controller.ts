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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  findAll(@Query() query: QueryTagDto) {
    return this.tagsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(+id, updateTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(+id);
  }

  @Post(':tagId/courses/:courseId')
  addCourseToTag(
    @Param('tagId') tagId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.tagsService.addCourseToTag(+tagId, +courseId);
  }

  @Delete(':tagId/courses/:courseId')
  removeCourseFromTag(
    @Param('tagId') tagId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.tagsService.removeCourseFromTag(+tagId, +courseId);
  }
}
