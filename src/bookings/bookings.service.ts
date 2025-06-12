import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Booking } from '@prisma/client';
import { BookingStatus } from './enums/booking-status.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private handlePrismaError(error: any, context: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'A booking with this unique constraint already exists',
          );
        case 'P2025':
          throw new NotFoundException('Booking not found');
        case 'P2003':
          throw new BadRequestException(
            'Invalid reference: The referenced record does not exist',
          );
        default:
          throw new BadRequestException(`Database error: ${error.message}`);
      }
    }
    throw error;
  }

  async findAll(): Promise<Booking[]> {
    try {
      return await this.prisma.booking.findMany({
        include: {
          user: true,
          instructor: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      return this.handlePrismaError(error, 'findAll');
    }
  }

  async findOne(id: number): Promise<Booking> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          user: true,
          course: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      return booking;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findOne');
    }
  }

  async findByUserId(userId: number): Promise<Booking[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.booking.findMany({
        where: { user_id: userId },
        include: {
          course: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(`Error in findByUserId: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByUserId');
    }
  }

  async findByInstructor(instructorId: number): Promise<Booking[]> {
    try {
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException(
          `Instructor with ID ${instructorId} not found`,
        );
      }

      return await this.prisma.booking.findMany({
        where: { instructor_id: instructorId },
        include: {
          user: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error in findByInstructor: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      return this.handlePrismaError(error, 'findByInstructor');
    }
  }

  async create(data: {
    user_id: number;
    course_id: number;
    booking_date: Date;
    status: BookingStatus;
  }): Promise<Booking> {
    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: data.user_id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${data.user_id} not found`);
      }

      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: data.course_id },
      });

      if (!course) {
        throw new NotFoundException(
          `Course with ID ${data.course_id} not found`,
        );
      }

      // Check for existing booking at the same time
      const existingBooking = await this.prisma.booking.findFirst({
        where: {
          course_id: data.course_id,
          booking_date: data.booking_date,
          status: {
            not: BookingStatus.CANCELLED,
          },
        },
      });

      if (existingBooking) {
        throw new ConflictException(
          'A booking already exists for this time slot',
        );
      }

      const booking = await this.prisma.booking.create({
        data,
        include: {
          course: true,
        },
      });

      // Send confirmation email
      try {
        await this.mailService.sendBookingConfirmation(
          user.email,
          user.name,
          course.instructor.name,
          data.booking_date,
          data.booking_date.toLocaleTimeString(),
          60,
          'Dance Realm Studio',
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send booking confirmation email: ${emailError.message}`,
          emailError.stack,
        );
        // Don't throw error, just log it
      }

      return booking;
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      return this.handlePrismaError(error, 'create');
    }
  }

  async update(id: number, data: Partial<Booking>): Promise<Booking> {
    try {
      const booking = await this.findOne(id);

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot update a cancelled booking');
      }

      return await this.prisma.booking.update({
        where: { id },
        data,
        include: {
          user: true,
          instructor: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'update');
    }
  }

  async updateStatus(id: number, status: BookingStatus): Promise<Booking> {
    try {
      const booking = await this.findOne(id);

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException(
          'Cannot update status of a cancelled booking',
        );
      }

      return await this.prisma.booking.update({
        where: { id },
        data: { status },
        include: {
          course: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error in updateStatus: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'updateStatus');
    }
  }

  async delete(id: number): Promise<Booking> {
    try {
      const booking = await this.findOne(id);

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      return await this.prisma.booking.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      return this.handlePrismaError(error, 'delete');
    }
  }
}
