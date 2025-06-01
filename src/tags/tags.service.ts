import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    return this.prisma.tag.create({
      data: createTagDto,
      include: {
        courses: {
          include: {
            instructor: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryTagDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'name',
      sort_order = 'asc',
      include_courses = false,
    } = query;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.TagWhereInput = {
      // Search filter
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    // Build the orderBy clause
    const orderBy: Prisma.TagOrderByWithRelationInput = {};
    if (sort_by === 'course_count') {
      orderBy.courses = {
        _count: sort_order,
      };
    } else {
      orderBy[sort_by] = sort_order;
    }

    const [total, tags] = await Promise.all([
      this.prisma.tag.count({ where }),
      this.prisma.tag.findMany({
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

    // Add course count to each tag
    const tagsWithStats = tags.map((tag) => ({
      ...tag,
      course_count: tag._count.courses,
    }));

    return {
      data: tagsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({
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

    if (!tag) return null;

    return {
      ...tag,
      course_count: tag._count.courses,
    };
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
      include: {
        courses: {
          include: {
            instructor: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }

  async addCourseToTag(tagId: number, courseId: number) {
    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        courses: {
          connect: { id: courseId },
        },
      },
      include: {
        courses: {
          include: {
            instructor: true,
          },
        },
      },
    });
  }

  async removeCourseFromTag(tagId: number, courseId: number) {
    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        courses: {
          disconnect: { id: courseId },
        },
      },
      include: {
        courses: {
          include: {
            instructor: true,
          },
        },
      },
    });
  }
}
