import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get('course-progress')
  getCourseProgress(@Req() req) {
    return { progress: [], message: "Course progress endpoint stub" };
  }
} 