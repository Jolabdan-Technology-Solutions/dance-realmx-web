import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { Roles } from '../auth/guards/roles.guard';
import { ResourceOwner } from '../auth/guards/resource-owner.guard';
import { Role } from '../auth/enums/role.enum';
import { BookingStatus } from './enums/booking-status.enum';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles(Role.STUDENT, Role.ADMIN)
  findAll(@Query('userId') userId: string) {
    return this.bookingsService.findByUserId(+userId);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ResourceOwner('booking')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN)
  create(
    @Body()
    createBookingDto: {
      course_id: number;
      booking_date: Date;
      status: BookingStatus;
    },
    @Req() req: any,
  ) {
    return this.bookingsService.create({
      ...createBookingDto,
      user_id: req.user.id,
    });
  }

  @Patch(':id/status')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ResourceOwner('booking')
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    return this.bookingsService.updateStatus(+id, status);
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ResourceOwner('booking')
  remove(@Param('id') id: string) {
    return this.bookingsService.delete(+id);
  }
}
