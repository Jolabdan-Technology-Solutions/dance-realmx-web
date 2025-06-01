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
import { ReviewsService } from './reviews.service';
import { Review } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
  ) {
    if (courseId) {
      return this.reviewsService.findByCourse(+courseId);
    }
    if (userId) {
      return this.reviewsService.findByUser(+userId);
    }
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @Get('course/:courseId/average-rating')
  getAverageRating(@Param('courseId') courseId: string) {
    return this.reviewsService.getAverageRating(+courseId);
  }

  @Post()
  create(
    @Body()
    createReviewDto: {
      user_id: number;
      course_id: number;
      rating: number;
      comment: string;
    },
  ) {
    return this.reviewsService.create(createReviewDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: Partial<Review>) {
    return this.reviewsService.update(+id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.delete(+id);
  }
}
