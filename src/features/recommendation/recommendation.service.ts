import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';
import {
  UserPreferences,
  ContentRecommendation,
  LearningPath,
} from './types';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string): Promise<ContentRecommendation[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const recommendations: ContentRecommendation[] = [];

    // Get courses based on user preferences and subscription
    const courses = await this.prisma.course.findMany({
      where: {
        difficulty: user.preferences.skillLevel,
        danceStyle: {
          in: user.preferences.danceStyles,
        },
        subscriptionRequired: {
          lte: user.subscriptionTier,
        },
      },
    });

    // Convert courses to recommendations
    courses.forEach((course) => {
      recommendations.push({
        type: 'COURSE',
        relevance: this.calculateRelevance(course, user.preferences),
        matchFactors: this.getMatchFactors(course, user.preferences),
        subscriptionRequired: course.subscriptionRequired,
      });
    });

    // Sort recommendations by relevance
    return recommendations.sort((a, b) => b.relevance - a.relevance);
  }

  async generateLearningPath(params: {
    userId: string;
    goals: string[];
    timeFrame: string;
  }): Promise<LearningPath> {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate learning path based on goals and user preferences
    const modules = await this.prisma.module.findMany({
      where: {
        difficulty: user.preferences.skillLevel,
        danceStyle: {
          in: user.preferences.danceStyles,
        },
      },
    });

    return {
      modules,
      estimatedDuration: this.calculateDuration(modules, params.timeFrame),
      difficulty: user.preferences.skillLevel,
      prerequisites: this.getPrerequisites(modules),
    };
  }

  async updateRecommendations(
    userId: string,
    updates: Partial<UserPreferences>,
  ): Promise<ContentRecommendation[]> {
    // Update user preferences
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          update: updates,
        },
      },
    });

    // Get new recommendations
    return this.getRecommendations(userId);
  }

  private calculateRelevance(
    content: any,
    preferences: UserPreferences,
  ): number {
    let relevance = 0;

    // Calculate relevance based on dance style match
    if (preferences.danceStyles.includes(content.danceStyle)) {
      relevance += 0.4;
    }

    // Calculate relevance based on skill level match
    if (content.difficulty === preferences.skillLevel) {
      relevance += 0.3;
    }

    // Calculate relevance based on subscription tier
    if (content.subscriptionRequired === preferences.subscriptionTier) {
      relevance += 0.3;
    }

    return relevance;
  }

  private getMatchFactors(
    content: any,
    preferences: UserPreferences,
  ): string[] {
    const factors: string[] = [];

    if (preferences.danceStyles.includes(content.danceStyle)) {
      factors.push('Dance style match');
    }

    if (content.difficulty === preferences.skillLevel) {
      factors.push('Skill level match');
    }

    if (content.subscriptionRequired === preferences.subscriptionTier) {
      factors.push('Subscription tier match');
    }

    return factors;
  }

  private calculateDuration(modules: any[], timeFrame: string): number {
    // Calculate total duration based on modules and time frame
    const totalDuration = modules.reduce(
      (sum, module) => sum + module.duration,
      0,
    );

    // Convert time frame to weeks
    const weeks = parseInt(timeFrame.split(' ')[0]) * 4;

    return Math.ceil(totalDuration / weeks);
  }

  private getPrerequisites(modules: any[]): string[] {
    // Extract prerequisites from modules
    return modules
      .flatMap((module) => module.prerequisites || [])
      .filter((prerequisite, index, self) => self.indexOf(prerequisite) === index);
  }
} 