import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resource } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      include: {
        course: true,
        module: true,
        lesson: true,
      },
    });
  }

  async findOne(id: number): Promise<Resource | null> {
    return this.prisma.resource.findUnique({
      where: { id },
      include: {
        course: true,
        module: true,
        lesson: true,
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
    course_id?: number;
    module_id?: number;
    lesson_id?: number;
  }): Promise<Resource> {
    return this.prisma.resource.create({
      data,
      include: {
        course: true,
        module: true,
        lesson: true,
      },
    });
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource> {
    return this.prisma.resource.update({
      where: { id },
      data,
      include: {
        course: true,
        module: true,
        lesson: true,
      },
    });
  }

  async delete(id: number): Promise<Resource> {
    return this.prisma.resource.delete({
      where: { id },
    });
  }
}
