import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Profile } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { user_id: userId },
    });
  }

  async update(userId: number, data: any): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        ...data,
        user_id: userId,
      },
    });
  }
}
