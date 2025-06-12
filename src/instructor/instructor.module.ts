import { Module } from '@nestjs/common';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorController],
  providers: [InstructorService, AnalyticsService],
  exports: [InstructorService, AnalyticsService],
})
export class InstructorModule {}
