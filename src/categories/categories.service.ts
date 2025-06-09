import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Prisma } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from "../auth/enums/role.enum";

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

  async create(createCategoryDto: CreateCategoryDto) {
    console.log("createCategoryDto");
    console.log(createCategoryDto);

    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });
  } 

  async findAll(query: QueryCategoryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      parent_id,
      sort_by = 'name',
      sort_order = 'asc',
      include_courses = false,
    } = query;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where = {
      AND: [
        // Parent filter
        parent_id ? { parent_id } : { parent_id: null },
        // Search filter
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
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
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

    return categories;
  }

  async findOne(id: number) {
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

    if (!category) return null;

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
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
  }

  async remove(id: number) {
    return this.prisma.category.delete({
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
  }
}
