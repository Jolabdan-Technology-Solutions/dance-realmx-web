import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  @Get()
  getEnrollments(@Req() req) {
    return { enrollments: [], message: "Enrollments endpoint stub" };
  }
} 