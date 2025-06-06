import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTier } from '@prisma/client';

export class ContentRecommendationDto {
  @ApiProperty({ enum: ['COURSE', 'RESOURCE', 'INSTRUCTOR', 'EVENT'] })
  type: 'COURSE' | 'RESOURCE' | 'INSTRUCTOR' | 'EVENT';

  @ApiProperty()
  relevance: number;

  @ApiProperty({ type: [String] })
  matchFactors: string[];

  @ApiProperty({ enum: SubscriptionTier })
  subscriptionRequired: SubscriptionTier;
}

export class LearningPathDto {
  @ApiProperty({ type: [Object] })
  modules: any[];

  @ApiProperty()
  estimatedDuration: number;

  @ApiProperty()
  difficulty: string;

  @ApiProperty({ type: [String] })
  prerequisites: string[];
}

export class UserPreferencesDto {
  @ApiProperty({ type: [String] })
  danceStyles: string[];

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

  @ApiProperty({ type: [String] })
  learningGoals: string[];

  @ApiProperty({ enum: SubscriptionTier })
  subscriptionTier: SubscriptionTier;
}

export class UpdatePreferencesDto {
  @ApiProperty({ type: UserPreferencesDto })
  preferences: Partial<UserPreferencesDto>;
}

export class GenerateLearningPathDto {
  @ApiProperty({ type: [String] })
  goals: string[];

  @ApiProperty()
  timeFrame: string;
} 