import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message } from '@prisma/client';
import { QueryMessageDto } from './dto/query-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryMessageDto) {
    const { page = 1, limit = 10, userId } = query;
    const skip = (page - 1) * limit;

    const where = userId
      ? {
          OR: [{ sender_id: userId }, { receiver_id: userId }],
        }
      : {};

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: true,
          receiver: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async findByUser(userId: number, query: QueryMessageDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          OR: [{ sender_id: userId }, { receiver_id: userId }],
        },
        include: {
          sender: true,
          receiver: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.message.count({
        where: {
          OR: [{ sender_id: userId }, { receiver_id: userId }],
        },
      }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByConversation(
    user1Id: number,
    user2Id: number,
    query: QueryMessageDto,
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        {
          AND: [{ sender_id: user1Id }, { receiver_id: user2Id }],
        },
        {
          AND: [{ sender_id: user2Id }, { receiver_id: user1Id }],
        },
      ],
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: true,
          receiver: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'asc',
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: {
    sender_id: number;
    receiver_id: number;
    content: string;
    read?: boolean;
  }) {
    return this.prisma.message.create({
      data: {
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
        read: data.read || false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async update(id: number, data: Partial<Message>) {
    return this.prisma.message.update({
      where: { id },
      data,
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.message.update({
      where: { id },
      data: { read: true },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.message.updateMany({
      where: {
        receiver_id: userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async delete(id: number) {
    return this.prisma.message.delete({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async deleteConversation(user1Id: number, user2Id: number) {
    return this.prisma.message.deleteMany({
      where: {
        OR: [
          {
            AND: [{ sender_id: user1Id }, { receiver_id: user2Id }],
          },
          {
            AND: [{ sender_id: user2Id }, { receiver_id: user1Id }],
          },
        ],
      },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.message.count({
      where: {
        receiver_id: userId,
        read: false,
      },
    });
  }
}
