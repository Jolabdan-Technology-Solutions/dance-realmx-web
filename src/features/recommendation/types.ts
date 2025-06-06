import { SubscriptionTier } from '@prisma/client';

export interface UserPreferences {
  danceStyles: string[];
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  learningGoals: string[];
  subscriptionTier: SubscriptionTier;
}

export interface ContentRecommendation {
  type: 'COURSE' | 'RESOURCE' | 'INSTRUCTOR' | 'EVENT';
  relevance: number;
  matchFactors: string[];
  subscriptionRequired: SubscriptionTier;
}

export interface LearningPath {
  modules: any[];
  estimatedDuration: number;
  difficulty: string;
  prerequisites: string[];
} 