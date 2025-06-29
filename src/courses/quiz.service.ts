import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, CreateQuizQuestionDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuiz(lessonId: number, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        lesson_id: lessonId,
        questions: {
          create: dto.questions.map((q) => ({
            text: q.text,
            order: q.order,
            answer: q.answer,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                is_correct: opt.is_correct ?? false,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
  }

  async getQuizByLesson(lessonId: number) {
    return this.prisma.quiz.findMany({
      where: { lesson_id: lessonId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
  }

  async addQuestion(quizId: number, dto: CreateQuizQuestionDto) {
    return this.prisma.quizQuestion.create({
      data: {
        quiz_id: quizId,
        text: dto.text,
        order: dto.order,
        answer: dto.answer,
        options: {
          create: dto.options.map((opt) => ({
            text: opt.text,
            is_correct: opt.is_correct ?? false,
          })),
        },
      },
      include: { options: true },
    });
  }

  async updateQuestion(
    quizId: number,
    questionId: number,
    dto: Partial<CreateQuizQuestionDto>,
  ) {
    // Optionally, check that the question belongs to the quiz
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });
    if (!question || question.quiz_id !== quizId) {
      throw new NotFoundException('Question not found in this quiz');
    }
    // Update question and options
    const updated = await this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        text: dto.text,
        order: dto.order,
        answer: dto.answer,
        options: dto.options
          ? {
              deleteMany: {},
              create: dto.options.map((opt) => ({
                text: opt.text,
                is_correct: opt.is_correct ?? false,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
    return updated;
  }

  async submitQuiz(quizId: number, answers: number[], userId?: number) {
    // Fetch quiz with questions and options
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.questions.length !== answers.length) {
      throw new BadRequestException(
        'Number of answers does not match number of questions',
      );
    }
    // Auto-grade
    let correct = 0;
    const answerRecords = quiz.questions.map((q, idx) => {
      const isCorrect = q.answer !== undefined && answers[idx] === q.answer;
      if (isCorrect) correct++;
      return {
        question_id: q.id,
        selected: answers[idx],
        is_correct: isCorrect,
      };
    });
    const score = (correct / quiz.questions.length) * 100;
    let attempt = null;
    if (userId) {
      attempt = await this.prisma.quizAttempt.create({
        data: {
          user_id: userId,
          quiz_id: quizId,
          score,
          correct,
          total: quiz.questions.length,
          answers: {
            create: answerRecords,
          },
        },
        include: { answers: true },
      });
    }
    return {
      total: quiz.questions.length,
      correct,
      score,
      attempt,
    };
  }

  async getUserAttempts(quizId: number, userId: number) {
    return this.prisma.quizAttempt.findMany({
      where: { quiz_id: quizId, user_id: userId },
      include: { answers: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAllAttempts(quizId: number) {
    return this.prisma.quizAttempt.findMany({
      where: { quiz_id: quizId },
      include: { user: true, answers: true },
      orderBy: { created_at: 'desc' },
    });
  }
}
