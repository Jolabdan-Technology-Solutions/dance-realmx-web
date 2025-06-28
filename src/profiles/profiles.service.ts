import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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

  async becomeProfessional(userId: number, profileData: any) {
    // Check if profile exists
    let profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
    });
    if (profile && profile.is_professional) {
      throw new BadRequestException('User is already a professional.');
    }
    if (!profile) {
      // Create profile if it does not exist
      await this.prisma.profile.create({
        data: { ...profileData, user_id: userId, is_professional: true },
      });
      return { message: 'Profile created and user is now a professional.' };
    }
    // Optionally, check for required fields in profileData here
    await this.prisma.profile.update({
      where: { user_id: userId },
      data: { ...profileData, is_professional: true },
    });
    return { message: 'User is now a professional and profile updated.' };
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

  async findProfessionalsByDateRange(startDate: string, endDate: string) {
    // Find professionals available within the specified date range
    return this.prisma.profile.findMany({
      where: {
        is_professional: true,
        availability: {
          path: ['$[*].start_date', '$[*].end_date'],
          array_contains: [{ $gte: startDate, $lte: endDate }],
        },
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

  // Helper function to check if a date range overlaps with availability
  private checkDateRangeOverlap(
    availability: any[],
    startDate: string,
    endDate: string,
    timeSlot?: string,
  ): boolean {
    if (!availability || !Array.isArray(availability)) return false;

    const searchStart = new Date(startDate);
    const searchEnd = new Date(endDate);

    return availability.some((range: any) => {
      const rangeStart = new Date(range.start_date);
      const rangeEnd = new Date(range.end_date);

      // Check if date ranges overlap
      const dateOverlap = searchStart <= rangeEnd && searchEnd >= rangeStart;

      if (!dateOverlap) return false;

      // If time slot is specified, check if it's available
      if (timeSlot && range.time_slots) {
        return range.time_slots.includes(timeSlot);
      }

      return true;
    });
  }

  async searchProfessionals(filters: SearchProfessionalsDto) {
    const {
      bio,
      phone_number,
      address,
      city,
      state,
      country,
      zip_code,
      is_professional,
      is_verified,
      service_category,
      dance_style,
      location,
      travel_distance,
      price_min,
      price_max,
      pricing,
      session_duration,
      years_experience,
      services,
      portfolio,
      date_start,
      date_end,
      time_slot,
      page = 1,
      pageSize = 10,
      sortBy = 'id',
      sortOrder = 'desc',
    } = filters;

    const where: any = {
      ...(bio && { bio: { contains: bio, mode: 'insensitive' } }),
      ...(phone_number && {
        phone_number: { contains: phone_number, mode: 'insensitive' },
      }),
      ...(address && { address: { contains: address, mode: 'insensitive' } }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(country && { country: { contains: country, mode: 'insensitive' } }),
      ...(zip_code && {
        zip_code: { contains: zip_code, mode: 'insensitive' },
      }),
      ...(is_professional !== undefined && { is_professional }),
      ...(is_verified !== undefined && { is_verified }),
      ...(service_category &&
        service_category.length && {
          service_category: { hasSome: service_category },
        }),
      ...(dance_style &&
        dance_style.length && { dance_style: { hasSome: dance_style } }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      ...(travel_distance !== undefined && {
        travel_distance: { lte: travel_distance },
      }),
      ...(price_min !== undefined && { price_min: { gte: price_min } }),
      ...(price_max !== undefined && { price_max: { lte: price_max } }),
      ...(pricing !== undefined && { pricing }),
      ...(session_duration !== undefined && {
        session_duration: { lte: session_duration },
      }),
      ...(years_experience !== undefined && {
        years_experience: { gte: years_experience },
      }),
      ...(services && services.length && { services: { hasSome: services } }),
      ...(portfolio && {
        portfolio: { contains: portfolio, mode: 'insensitive' },
      }),
    };

    // Get all profiles first, then filter by availability in memory
    // This is because Prisma doesn't have great support for complex JSON queries
    let results = await this.prisma.profile.findMany({
      where,
      include: { user: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });

    // Filter by availability if date range is specified
    if (date_start && date_end) {
      results = results.filter((profile) => {
        if (!profile.availability) return false;
        return this.checkDateRangeOverlap(
          profile.availability as any[],
          date_start,
          date_end,
          time_slot,
        );
      });
    }

    // Get total count for pagination
    const totalProfiles = await this.prisma.profile.findMany({ where });
    let total = totalProfiles.length;

    if (date_start && date_end) {
      total = totalProfiles.filter((profile) => {
        if (!profile.availability) return false;
        return this.checkDateRangeOverlap(
          profile.availability as any[],
          date_start,
          date_end,
          time_slot,
        );
      }).length;
    }

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
