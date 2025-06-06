import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ContentRecommendation,
  LearningPath,
  UserPreferences,
} from './types';
import {
  ContentRecommendationDto,
  LearningPathDto,
  UpdatePreferencesDto,
  GenerateLearningPathDto,
} from './dto/recommendation.dto';

@ApiTags('recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Returns personalized content recommendations',
    type: [ContentRecommendationDto],
  })
  async getRecommendations(@Request() req): Promise<ContentRecommendation[]> {
    return this.recommendationService.getRecommendations(req.user.id);
  }

  @Post('learning-path')
  @ApiOperation({ summary: 'Generate personalized learning path' })
  @ApiResponse({
    status: 201,
    description: 'Returns a personalized learning path',
    type: LearningPathDto,
  })
  async generateLearningPath(
    @Request() req,
    @Body() body: GenerateLearningPathDto,
  ): Promise<LearningPath> {
    return this.recommendationService.generateLearningPath({
      userId: req.user.id,
      goals: body.goals,
      timeFrame: body.timeFrame,
    });
  }

  @Post('update')
  @ApiOperation({ summary: 'Update user preferences and get new recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Returns updated recommendations based on new preferences',
    type: [ContentRecommendationDto],
  })
  async updateRecommendations(
    @Request() req,
    @Body() updates: UpdatePreferencesDto,
  ): Promise<ContentRecommendation[]> {
    return this.recommendationService.updateRecommendations(
      req.user.id,
      updates.preferences,
    );
  }
} 