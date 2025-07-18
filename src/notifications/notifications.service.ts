import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification } from '@prisma/client';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryNotificationDto) {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * limit;

    const where = userId ? { user_id: userId } : {};

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUser(userId: number, query: QueryNotificationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        include: {
          user: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.notification.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUnreadByUser(userId: number, query: QueryNotificationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          user_id: userId,
          read: false,
        },
        include: {
          user: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.notification.count({
        where: {
          user_id: userId,
          read: false,
        },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: {
    user_id: number;
    title: string;
    message: string;
    type: string;
    read?: boolean;
    data?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async update(id: number, data: Partial<Notification>): Promise<Notification> {
    const { id: _, user_id: __, data: jsonData, ...updateData } = data;
    return this.prisma.notification.update({
      where: { id },
      data: {
        ...updateData,
        data: jsonData as any,
      },
      include: {
        user: true,
      },
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
      include: {
        user: true,
      },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async delete(id: number): Promise<Notification> {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteAllByUser(userId: number): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { user_id: userId },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        user_id: userId,
        read: false,
      },
    });
  }
}
