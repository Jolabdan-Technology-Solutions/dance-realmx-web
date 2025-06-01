import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Booking } from '@prisma/client';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      include: {
        user: true,
        instructor: true,
      },
    });
  }

  async findOne(id: number): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });
  }

  async findByUserId(userId: number): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { user_id: userId },
      include: {
        course: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findByInstructor(instructorId: number): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { instructor_id: instructorId },
      include: {
        user: true,
      },
    });
  }

  async create(data: {
    user_id: number;
    course_id: number;
    booking_date: Date;
    status: BookingStatus;
  }): Promise<Booking> {
    const booking = await this.prisma.booking.create({
      data,
      include: {
        course: true,
      },
    });

    // Get user and course details for email
    const user = await this.prisma.user.findUnique({
      where: { id: data.user_id },
    });
    const course = await this.prisma.course.findUnique({
      where: { id: data.course_id },
    });

    if (user && course) {
      await this.mailService.sendBookingConfirmation(
        user.email,
        user.name,
        course.instructor.name,
        data.booking_date,
        data.booking_date.toLocaleTimeString(),
        60, // Default duration of 60 minutes
        'Dance Realm Studio', // Default location
      );
    }

    return booking;
  }

  async update(id: number, data: Partial<Booking>): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        user: true,
        instructor: true,
      },
    });
  }

  async updateStatus(id: number, status: BookingStatus): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        course: true,
      },
    });
  }

  async delete(id: number): Promise<Booking> {
    return this.prisma.booking.delete({
      where: { id },
    });
  }
}
