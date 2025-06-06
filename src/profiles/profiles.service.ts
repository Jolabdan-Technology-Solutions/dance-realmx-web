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

  async becomeProfessional(userId: number): Promise<Profile> {
    return this.prisma.profile.update({
      where: { user_id: userId },
      data: {
        is_professional: true,
      },
    });
  }

  async bookProfessional(professionalId: string, userId: number) {
    // For now, just create a booking record
    // This will be replaced with a proper booking system later
    return this.prisma.booking.create({
      data: {
        professional_id: parseInt(professionalId),
        user_id: userId,
        status: 'PENDING',
        start_time: new Date(),
        end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    });
  }

  async getProfessionals() {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }
}
