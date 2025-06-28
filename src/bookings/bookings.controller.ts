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
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { ResourceOwner } from '../auth/guards/resource-owner.guard';
import { BookingStatus } from './enums/booking-status.enum';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';

@Controller('bookings')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @RequireFeature(Feature.MANAGE_BOOKINGS)
  findAll(@Query('userId') userId: string) {
    return this.bookingsService.findByUserId(+userId);
  }

  @Get(':id')
  @RequireFeature(Feature.MANAGE_BOOKINGS)
  @ResourceOwner('booking')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Post()
  @RequireFeature(Feature.CREATE_BOOKINGS)
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
  @RequireFeature(Feature.MANAGE_BOOKINGS)
  @ResourceOwner('booking')
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    return this.bookingsService.updateStatus(+id, status);
  }

  @Delete(':id')
  @RequireFeature(Feature.MANAGE_BOOKINGS)
  @ResourceOwner('booking')
  remove(@Param('id') id: string) {
    return this.bookingsService.delete(+id);
  }
}
