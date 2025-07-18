import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(token) },
        include: {
          subscriptions: true,
        },
      });

      if (user) {
        req['user'] = user;
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
    }

    next();
  }
}
