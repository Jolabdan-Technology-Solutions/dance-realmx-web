import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resource } from '@prisma/client';
import { CreateResourceDto } from './dto/create-resource.dto';
import { Prisma } from '@prisma/client';

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
  private readonly logger = new Logger(ResourcesService.name);

  constructor(private prisma: PrismaService) {}

  private handlePrismaError(error: any, context: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A resource with this unique constraint already exists',
          );
        case 'P2025':
          throw new NotFoundException('Resource not found');
        case 'P2003':
          throw new BadRequestException(
            'Invalid reference: The referenced record does not exist',
          );
        default:
          throw new BadRequestException(`Database error: ${error.message}`);
      }
    }
    throw error;
  }

  async findAll(options: FindAllOptions = {}): Promise<Resource[]> {
    try {
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
        if (isNaN(min) || (max && isNaN(max))) {
          throw new BadRequestException('Invalid price range format');
        }
        where.price = {
          gte: min,
          lte: max || undefined,
        };
      }

      if (sellerId) {
        const seller = await this.prisma.user.findUnique({
          where: { id: sellerId },
        });
        if (!seller) {
          throw new NotFoundException(`Seller with ID ${sellerId} not found`);
        }
        where.sellerId = sellerId;
      }

      return await this.prisma.resource.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'findAll');
    }
  }

  async findOne(id: number): Promise<Resource> {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });

      if (!resource) {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }

      return resource;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findOne');
    }
  }

  async findByCourse(courseId: number): Promise<Resource[]> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { course_id: courseId },
        include: {
          module: true,
          lesson: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByCourse: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByCourse');
    }
  }

  async findByModule(moduleId: number): Promise<Resource[]> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { module_id: moduleId },
        include: {
          course: true,
          lesson: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByModule: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByModule');
    }
  }

  async findByLesson(lessonId: number): Promise<Resource[]> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }

      return await this.prisma.resource.findMany({
        where: { lesson_id: lessonId },
        include: {
          course: true,
          module: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByLesson: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByLesson');
    }
  }

  async create(
    createResourceDto: CreateResourceDto,
    userId: number,
  ): Promise<Resource> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.resource.create({
        data: {
          ...createResourceDto,
          sellerId: userId,
        },
      });
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'create');
    }
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource> {
    try {
      const resource = await this.findOne(id);

      return await this.prisma.resource.update({
        where: { id },
        data,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              profile_image_url: true,
              role: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'update');
    }
  }

  async delete(id: number): Promise<Resource> {
    try {
      const resource = await this.findOne(id);

      return await this.prisma.resource.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'delete');
    }
  }

  async purchase(resourceId: number, userId: number): Promise<any> {
    try {
      const resource = await this.findOne(resourceId);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user has already purchased this resource
      const existingPurchase = await this.prisma.resourcePurchase.findFirst({
        where: {
          resource_id: resourceId,
          user_id: userId,
        },
      });

      if (existingPurchase) {
        throw new ConflictException('User has already purchased this resource');
      }

      return await this.prisma.resourcePurchase.create({
        data: {
          resource_id: resourceId,
          user_id: userId,
          status: 'COMPLETED',
          amount: resource.price || 0,
          purchased_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error in purchase: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      return this.handlePrismaError(error, 'purchase');
    }
  }
}
