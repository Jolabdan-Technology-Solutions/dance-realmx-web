import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { MailModule } from '../mail/mail.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';

@Module({
  imports: [PrismaModule, PermissionsModule, MailModule, SubscriptionsModule],
  controllers: [CoursesController, QuizController],
  providers: [CoursesService, QuizService],
  exports: [CoursesService],
})
export class CoursesModule {}
