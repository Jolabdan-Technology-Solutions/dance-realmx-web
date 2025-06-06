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
  Req,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { Resource, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireSubscription } from '../auth/decorators/require-subscription.decorator';
import { CreateResourceDto } from './dto/create-resource.dto';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.resourcesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(+id);
  }

  @Post()
  @RequireSubscription('CURRICULUM_SELLER')
  async create(@Body() createResourceDto: CreateResourceDto, @Req() req: { user: User }) {
    return this.resourcesService.create(createResourceDto, req.user.id);
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

  @Post(':id/purchase')
  @RequireSubscription('DIRECTORY_MEMBER')
  async purchase(@Param('id') id: string, @Req() req: { user: User }) {
    return this.resourcesService.purchase(+id, req.user.id);
  }
}
