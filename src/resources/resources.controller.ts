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
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ResourceDto } from './dto/resource.dto';

@ApiTags('Resources')
@ApiBearerAuth()
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(RolesGuard, JwtAuthGuard)
  @Roles(UserRole.CURRICULUM_SELLER, UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiBody({ type: CreateResourceDto })
  @ApiResponse({
    status: 201,
    description: 'The resource has been successfully created.',
    type: ResourceDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createResourceDto: CreateResourceDto, @Request() req) {
    return this.resourcesService.create(createResourceDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resources with optional filters' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'danceStyle', required: false, type: String })
  @ApiQuery({ name: 'ageRange', required: false, type: String })
  @ApiQuery({ name: 'difficultyLevel', required: false, type: String })
  @ApiQuery({ name: 'priceRange', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Return all resources matching the filters.',
    type: [ResourceDto],
  })
  findAll(
    @Query()
    query: {
      type?: string;
      search?: string;
      danceStyle?: string;
      ageRange?: string;
      difficultyLevel?: string;
      priceRange?: string;
      sellerId?: number;
    },
  ) {
    return this.resourcesService.findAll(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular resources' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of resources to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Return popular resources based on purchase count.',
    type: [ResourceDto],
  })
  getPopularResources(@Query('limit') limit?: number) {
    return this.resourcesService.getPopularResources(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search resources' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query',
  })
  @ApiResponse({
    status: 200,
    description: 'Return resources matching the search query.',
    type: [ResourceDto],
  })
  searchResources(@Query('q') query: string) {
    return this.resourcesService.searchResources(query);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get resources by category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Return resources in the specified category.',
    type: [ResourceDto],
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findByCategory(id);
  }

  @Get('seller/:id')
  @ApiOperation({ summary: 'Get resources by seller' })
  @ApiParam({ name: 'id', type: Number, description: 'Seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Return resources from the specified seller.',
    type: [ResourceDto],
  })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  findBySeller(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findBySeller(id);
  }

  @Get('stats/resource/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CURRICULUM_SELLER, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get resource statistics' })
  @ApiParam({ name: 'id', type: Number, description: 'Resource ID' })
  @ApiResponse({
    status: 200,
    description: 'Return statistics for the specified resource.',
    schema: {
      type: 'object',
      properties: {
        resource: { type: 'object' },
        totalPurchases: { type: 'number' },
        totalRevenue: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getResourceStats(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.getResourceStats(id);
  }

  @Get('stats/seller/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CURRICULUM_SELLER, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get seller statistics' })
  @ApiParam({ name: 'id', type: Number, description: 'Seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Return statistics for the specified seller.',
    schema: {
      type: 'object',
      properties: {
        totalResources: { type: 'number' },
        totalPurchases: { type: 'number' },
        totalRevenue: { type: 'number' },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              purchases: { type: 'number' },
              revenue: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getSellerStats(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.getSellerStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Resource ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the specified resource.',
    type: ResourceDto,
  })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findOne(id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get resources by course' })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return resources for the specified course.',
    type: [ResourceDto],
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.resourcesService.findByCourse(courseId);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Get resources by module' })
  @ApiParam({ name: 'moduleId', type: Number, description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Return resources for the specified module.',
    type: [ResourceDto],
  })
  @ApiResponse({ status: 404, description: 'Module not found.' })
  findByModule(@Param('moduleId', ParseIntPipe) moduleId: number) {
    return this.resourcesService.findByModule(moduleId);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get resources by lesson' })
  @ApiParam({ name: 'lessonId', type: Number, description: 'Lesson ID' })
  @ApiResponse({
    status: 200,
    description: 'Return resources for the specified lesson.',
    type: [ResourceDto],
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  findByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.resourcesService.findByLesson(lessonId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CURRICULUM_SELLER, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({ name: 'id', type: Number, description: 'Resource ID' })
  @ApiBody({ type: UpdateResourceDto })
  @ApiResponse({
    status: 200,
    description: 'The resource has been successfully updated.',
    type: ResourceDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CURRICULUM_SELLER, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiParam({ name: 'id', type: Number, description: 'Resource ID' })
  @ApiResponse({
    status: 200,
    description: 'The resource has been successfully deleted.',
    type: ResourceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.delete(id);
  }

  @Post(':id/purchase')
  @UseGuards(RolesGuard, JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Purchase a resource' })
  @ApiParam({ name: 'id', type: Number, description: 'Resource ID' })
  @ApiResponse({
    status: 201,
    description: 'The resource has been successfully purchased.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        resource_id: { type: 'number' },
        user_id: { type: 'number' },
        status: { type: 'string' },
        amount: { type: 'number' },
        purchased_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  @ApiResponse({ status: 409, description: 'Resource already purchased.' })
  purchase(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.resourcesService.purchase(id, req.user.id);
  }
}
