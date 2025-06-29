import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateQuizDto, CreateQuizQuestionDto } from './dto/create-quiz.dto';
import { QuizService } from './quiz.service';
import { Request } from 'express';

@Controller('lessons/:lessonId/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    return this.quizService.createQuiz(+lessonId, createQuizDto);
  }

  @Get()
  async getQuizByLesson(@Param('lessonId') lessonId: string) {
    return this.quizService.getQuizByLesson(+lessonId);
  }

  @Post(':quizId/questions')
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() createQuestionDto: CreateQuizQuestionDto,
  ) {
    return this.quizService.addQuestion(+quizId, createQuestionDto);
  }

  @Patch(':quizId/questions/:questionId')
  async updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: Partial<CreateQuizQuestionDto>,
  ) {
    return this.quizService.updateQuestion(
      +quizId,
      +questionId,
      updateQuestionDto,
    );
  }

  @Post(':quizId/submit')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() submission: { answers: number[] },
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.quizService.submitQuiz(
      +quizId,
      submission.answers,
      req.user.id,
    );
  }

  @Get(':quizId/attempts/me')
  async getMyAttempts(
    @Param('quizId') quizId: string,
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.quizService.getUserAttempts(+quizId, req.user.id);
  }

  @Get(':quizId/attempts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR_ADMIN, UserRole.ADMIN)
  async getAllAttempts(@Param('quizId') quizId: string) {
    return this.quizService.getAllAttempts(+quizId);
  }
}
