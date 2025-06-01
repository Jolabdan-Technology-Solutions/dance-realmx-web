import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Review[]> {
    return this.prisma.review.findMany({
      include: {
        user: true,
        course: true,
      },
    });
  }

  async findOne(id: number): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });
  }

  async findByCourse(courseId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { course_id: courseId },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: number): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { user_id: userId },
      include: {
        course: true,
      },
    });
  }

  async create(data: {
    user_id: number;
    course_id: number;
    rating: number;
    comment: string;
  }): Promise<Review> {
    return this.prisma.review.create({
      data,
      include: {
        user: true,
        course: true,
      },
    });
  }

  async update(id: number, data: Partial<Review>): Promise<Review> {
    return this.prisma.review.update({
      where: { id },
      data,
      include: {
        user: true,
        course: true,
      },
    });
  }

  async delete(id: number): Promise<Review> {
    return this.prisma.review.delete({
      where: { id },
    });
  }

  async getAverageRating(courseId: number): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { course_id: courseId },
      _avg: {
        rating: true,
      },
    });
    return result._avg.rating || 0;
  }
}
