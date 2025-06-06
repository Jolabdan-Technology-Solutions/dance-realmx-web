import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resource } from '@prisma/client';

interface FindAllOptions {
  type?: string;
  search?: string;
  danceStyle?: string;
  ageRange?: string;
  difficultyLevel?: string;
  priceRange?: string;
  sellerId?: number;
}

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(options: FindAllOptions = {}): Promise<Resource[]> {
    const {
      type,
      search,
      danceStyle,
      ageRange,
      difficultyLevel,
      priceRange,
      sellerId,
    } = options;

    // Build the where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (danceStyle) {
      where.danceStyle = danceStyle;
    }

    if (ageRange) {
      where.ageRange = ageRange;
    }

    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      where.price = {
        gte: min,
        lte: max || undefined,
      };
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    return this.prisma.resource.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isApprovedSeller: true,
          },
        },
        category: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Resource | null> {
    return this.prisma.resource.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isApprovedSeller: true,
          },
        },
        category: true,
      },
    });
  }

  async findByCourse(courseId: number): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { course_id: courseId },
      include: {
        module: true,
        lesson: true,
      },
    });
  }

  async findByModule(moduleId: number): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { module_id: moduleId },
      include: {
        course: true,
        lesson: true,
      },
    });
  }

  async findByLesson(lessonId: number): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { lesson_id: lessonId },
      include: {
        course: true,
        module: true,
      },
    });
  }

  async create(data: {
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
    categoryId?: number;
  }): Promise<Resource> {
    return this.prisma.resource.create({
      data,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isApprovedSeller: true,
          },
        },
        category: true,
      },
    });
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource> {
    return this.prisma.resource.update({
      where: { id },
      data,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
            isApprovedSeller: true,
          },
        },
        category: true,
      },
    });
  }

  async delete(id: number): Promise<Resource> {
    return this.prisma.resource.delete({
      where: { id },
    });
  }
}
