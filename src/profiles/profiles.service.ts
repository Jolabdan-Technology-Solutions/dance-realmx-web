import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number) /*: any*/ {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { user_id: userId },
      });

      // If no profile exists, return null instead of throwing an error
      return profile;
    } catch (error) {
      console.error('Error finding profile for user:', userId, error);
      throw error;
    }
  }

  async update(userId: number, data: any) /*: any*/ {
    console.log('ProfilesService.update called with:', { userId, data });

    try {
      const result = await this.prisma.profile.upsert({
        where: { user_id: userId },
        update: data,
        create: {
          ...data,
          user_id: userId,
        },
      });

      console.log('Profile upsert result:', result);
      return result;
    } catch (error) {
      console.error('Profile upsert error:', error);
      throw error;
    }
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
        instructor_id: parseInt(professionalId),
        user_id: userId,
        status: 'PENDING',
        session_start: new Date(),
        session_end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
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

  // Helper function to check if a professional is available on a specific date with specific time slots
  private checkAvailabilityMatch(
    availability: any[],
    requestedDate: string,
    requestedTimeSlots: string[],
  ): boolean {
    if (!availability || !Array.isArray(availability)) return false;

    const requestedDateObj = new Date(requestedDate);
    const requestedDateStr = requestedDateObj.toISOString().split('T')[0];

    return availability.some((range: any) => {
      const rangeStart = new Date(range.start_date);
      const rangeEnd = new Date(range.end_date);
      const rangeStartStr = rangeStart.toISOString().split('T')[0];
      const rangeEndStr = rangeEnd.toISOString().split('T')[0];

      // Check if the requested date falls within this availability range
      const dateMatch =
        requestedDateStr >= rangeStartStr && requestedDateStr <= rangeEndStr;

      if (!dateMatch) return false;

      // If no specific time slots are requested, just check date availability
      if (!requestedTimeSlots || requestedTimeSlots.length === 0) {
        return true;
      }

      // Check if the requested time slots are available
      if (range.time_slots && Array.isArray(range.time_slots)) {
        return requestedTimeSlots.some((requestedSlot) =>
          range.time_slots.includes(requestedSlot),
        );
      }

      return false;
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
      availability_dates,
      availability_time_slots,
      availability_data,
      page = 1,
      pageSize = 10,
      sortBy = 'id',
      sortOrder = 'desc',
    } = filters;

    const where: any = {
      // Only filter by is_professional if explicitly set to true
      ...(is_professional === true && { is_professional: true }),

      // Make text searches more flexible with partial matches
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
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      ...(portfolio && {
        portfolio: { contains: portfolio, mode: 'insensitive' },
      }),

      // Make array searches more flexible - use hasAny instead of hasSome for partial matches
      ...(service_category &&
        service_category.length && {
          service_category: { hasSome: service_category },
        }),
      ...(dance_style &&
        dance_style.length && { dance_style: { hasSome: dance_style } }),
      ...(services && services.length && { services: { hasSome: services } }),

      // Make numeric ranges more flexible with wider tolerances
      ...(travel_distance !== undefined && {
        travel_distance: { lte: travel_distance * 1.5 }, // Allow 50% more distance
      }),
      ...(price_min !== undefined && {
        OR: [
          { price_min: { gte: price_min * 0.8 } }, // Allow 20% less than min
          { pricing: { gte: price_min * 0.8 } },
        ],
      }),
      ...(price_max !== undefined && {
        OR: [
          { price_max: { lte: price_max * 1.2 } }, // Allow 20% more than max
          { pricing: { lte: price_max * 1.2 } },
        ],
      }),
      ...(pricing !== undefined && {
        OR: [
          { pricing: { gte: pricing * 0.8, lte: pricing * 1.2 } }, // Allow 20% range
          { price_min: { lte: pricing * 1.2 } },
          { price_max: { gte: pricing * 0.8 } },
        ],
      }),
      ...(session_duration !== undefined && {
        session_duration: { lte: session_duration * 1.5 }, // Allow 50% more duration
      }),
      ...(years_experience !== undefined && {
        years_experience: { gte: years_experience * 0.8 }, // Allow 20% less experience
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

    // Filter by availability if any availability criteria are specified
    const hasAvailabilityFilter =
      date_start ||
      date_end ||
      availability_dates ||
      availability_time_slots ||
      availability_data;

    if (hasAvailabilityFilter) {
      results = results.filter((profile) => {
        // If no availability data, still include the profile (less strict)
        if (!profile.availability) return true;

        // Handle different availability formats
        if (date_start && date_end) {
          return this.checkDateRangeOverlap(
            profile.availability as any[],
            date_start,
            date_end,
            time_slot,
          );
        }

        // Handle availability_data format (from frontend)
        if (availability_data && availability_data.length > 0) {
          return availability_data.some((requestedAvail: any) => {
            const requestedDate = requestedAvail.date;
            const requestedTimeSlots = requestedAvail.time_slots || [];

            return this.checkAvailabilityMatch(
              profile.availability as any[],
              requestedDate,
              requestedTimeSlots,
            );
          });
        }

        // Handle separate dates and time slots
        if (availability_dates && availability_dates.length > 0) {
          const requestedTimeSlots = availability_time_slots || [];
          return availability_dates.some((requestedDate: string) => {
            return this.checkAvailabilityMatch(
              profile.availability as any[],
              requestedDate,
              requestedTimeSlots,
            );
          });
        }

        return true;
      });
    }

    // Get total count for pagination
    const totalProfiles = await this.prisma.profile.findMany({ where });
    let total = totalProfiles.length;

    if (hasAvailabilityFilter) {
      total = totalProfiles.filter((profile) => {
        // If no availability data, still include the profile (less strict)
        if (!profile.availability) return true;

        // Apply the same availability filtering logic
        if (date_start && date_end) {
          return this.checkDateRangeOverlap(
            profile.availability as any[],
            date_start,
            date_end,
            time_slot,
          );
        }

        if (availability_data && availability_data.length > 0) {
          return availability_data.some((requestedAvail: any) => {
            const requestedDate = requestedAvail.date;
            const requestedTimeSlots = requestedAvail.time_slots || [];

            return this.checkAvailabilityMatch(
              profile.availability as any[],
              requestedDate,
              requestedTimeSlots,
            );
          });
        }

        if (availability_dates && availability_dates.length > 0) {
          const requestedTimeSlots = availability_time_slots || [];
          return availability_dates.some((requestedDate: string) => {
            return this.checkAvailabilityMatch(
              profile.availability as any[],
              requestedDate,
              requestedTimeSlots,
            );
          });
        }

        return true;
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
