import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number) /*: any*/ {
    return this.prisma.profile.findUnique({
      where: { user_id: userId },
    });
  }

  async update(userId: number, data: any) /*: any*/ {
    return this.prisma.profile.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        ...data,
        user_id: userId,
      },
    });
  }

  async becomeProfessional(userId: number) /*: any*/ {
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
      select: {
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

  async findProfessionalsByLocation(location: string) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        location: { equals: location, mode: 'insensitive' },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByDanceStyle(danceStyle: string) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        dance_style: { has: danceStyle },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByCategory(category: string) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        service_category: { has: category },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByState(state: string) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        state: { equals: state, mode: 'insensitive' },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByCity(city: string) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        city: { equals: city, mode: 'insensitive' },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByDate(date: string) {
    // Assumes availability is stored as array of ISO strings in JSON
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        availability: { array_contains: [date] },
      },
      include: { user: true },
    });
  }

  async findProfessionalsByPricing(min: number, max: number) {
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        pricing: { gte: min, lte: max },
      },
      include: { user: true },
    });
  }

  async searchProfessionals(filters: SearchProfessionalsDto) {
    const {
      location,
      danceStyle,
      danceStyles,
      category,
      categories,
      state,
      city,
      date,
      min,
      max,
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filters;

    const where: any = {
      is_professional: true,
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      ...(danceStyle && { dance_style: { has: danceStyle } }),
      ...(Array.isArray(danceStyles) &&
        danceStyles.length > 0 && { dance_style: { hasSome: danceStyles } }),
      ...(category && { service_category: { has: category } }),
      ...(Array.isArray(categories) &&
        categories.length > 0 && { service_category: { hasSome: categories } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(date && { availability: { array_contains: [date] } }),
      ...(min !== undefined &&
        max !== undefined && { pricing: { gte: min, lte: max } }),
    };

    const [results, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: { user: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async bookProfessionalById(
    professionalId: string,
    userId: number,
    bookingDto: any,
  ) {
    // bookingDto should contain date, service, notes, etc.
    return this.prisma.booking.create({
      data: {
        instructor_id: parseInt(professionalId),
        user_id: userId,
        session_start: new Date(bookingDto.date),
        session_end: new Date(
          new Date(bookingDto.date).getTime() +
            (bookingDto.sessionDuration || 60) * 60000,
        ),
        status: 'PENDING',
        ...bookingDto,
      },
    });
  }
}
