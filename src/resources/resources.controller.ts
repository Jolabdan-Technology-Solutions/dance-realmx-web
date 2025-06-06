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
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('danceStyle') danceStyle?: string,
    @Query('ageRange') ageRange?: string,
    @Query('difficultyLevel') difficultyLevel?: string,
    @Query('priceRange') priceRange?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.resourcesService.findAll({
      type,
      search,
      danceStyle,
      ageRange,
      difficultyLevel,
      priceRange,
      sellerId: sellerId ? +sellerId : undefined,
    });
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
      price: number;
      danceStyle?: string;
      ageRange?: string;
      difficultyLevel?: string;
      sellerId: number;
      thumbnailUrl?: string;
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
