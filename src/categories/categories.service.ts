import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

type CategoryWithCount = {
  _count: {
    courses: number;
  };
};

type CategoryWithChildren = CategoryWithCount & {
  children: (CategoryWithCount & {
    children: CategoryWithCount[];
  })[];
};

type CategoryResult = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
  course_count: number;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private handlePrismaError(error: any, context: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          const field = error.meta?.target?.[0] || 'field';
          throw new ConflictException(
            `A category with this ${field} already exists`,
          );
        case 'P2025':
          throw new NotFoundException(`Category not found`);
        case 'P2003':
          throw new BadRequestException(
            'Invalid reference: The referenced record does not exist',
          );
        case 'P2014':
          throw new BadRequestException(
            'Invalid ID: The provided ID is invalid',
          );
        default:
          throw new BadRequestException(`Database error: ${error.message}`);
      }
    }
    throw error;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: createCategoryDto,
        include: {
          _count: {
            select: {
              courses: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  async findAll(query: QueryCategoryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        parent_id,
        sort_by = 'name',
        sort_order = 'asc',
        include_courses = false,
      } = query;

      // Validate pagination parameters
      if (page < 1)
        throw new BadRequestException('Page number must be greater than 0');
      if (limit < 1)
        throw new BadRequestException('Limit must be greater than 0');
      if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

      const skip = (page - 1) * limit;

      // Validate parent_id if provided
      if (parent_id) {
        const parentExists = await this.prisma.category.findUnique({
          where: { id: parent_id },
        });
        if (!parentExists) {
          throw new BadRequestException('Parent category does not exist');
        }
      }

      // Build the where clause
      const where = {
        AND: [
          parent_id ? { parent_id } : { parent_id: null },
          search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ],
              }
            : {},
        ],
      };

      // Validate sort parameters
      const validSortFields = [
        'name',
        'created_at',
        'updated_at',
        'course_count',
      ];
      if (!validSortFields.includes(sort_by)) {
        throw new BadRequestException(
          `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
        );
      }

      // Build the orderBy clause
      const orderBy: any = {};
      if (sort_by === 'course_count') {
        orderBy.courses = {
          _count: sort_order,
        };
      } else {
        orderBy[sort_by] = sort_order;
      }

      const [total, categories] = await Promise.all([
        this.prisma.category.count({ where }),
        this.prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            courses: include_courses
              ? {
                  include: {
                    instructor: true,
                    _count: {
                      select: {
                        enrollments: true,
                      },
                    },
                  },
                }
              : false,
            _count: {
              select: {
                courses: true,
              },
            },
          },
        }),
      ]);

      return {
        data: categories,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.handlePrismaError(error, 'findAll');
    }
  }

  async findTree() {
    try {
      return await this.prisma.category.findMany({
        where: {
          parent_id: null,
        },
        include: {
          children: {
            include: {
              children: {
                include: {
                  _count: {
                    select: {
                      courses: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  courses: true,
                },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'findTree');
    }
  }

  async findOne(id: number) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          courses: {
            include: {
              instructor: true,
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      this.handlePrismaError(error, 'findOne');
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      // Check if category exists
      const categoryExists = await this.prisma.category.findUnique({
        where: { id },
      });
      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Validate parent_id if provided
      if (updateCategoryDto.parent_id) {
        // Prevent circular references
        if (updateCategoryDto.parent_id === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        const parentExists = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parent_id },
        });
        if (!parentExists) {
          throw new BadRequestException('Parent category does not exist');
        }
      }

      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          courses: {
            include: {
              instructor: true,
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'update');
    }
  }

  async remove(id: number) {
    try {
      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              courses: true,
              children: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Check if category has courses
      if (category._count.courses > 0) {
        throw new ConflictException(
          'Cannot delete category with associated courses',
        );
      }

      // Check if category has children
      if (category._count.children > 0) {
        throw new ConflictException(
          'Cannot delete category with child categories',
        );
      }

      return await this.prisma.category.delete({
        where: { id },
        include: {
          courses: {
            include: {
              instructor: true,
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'remove');
    }
  }
}
