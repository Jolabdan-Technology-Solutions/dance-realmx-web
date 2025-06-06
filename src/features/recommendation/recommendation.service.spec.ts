import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationService } from './recommendation.service';
import { SubscriptionTier } from '@prisma/client';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            course: {
              findMany: jest.fn(),
            },
            resource: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getRecommendations', () => {
    it('should return appropriate recommendations for Silver tier', async () => {
      const mockUser = {
        id: '1',
        subscriptionTier: SubscriptionTier.SILVER,
        preferences: {
          danceStyles: ['Hip Hop'],
          skillLevel: 'BEGINNER',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const recommendations = await service.getRecommendations('1');

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].subscriptionRequired).toBe('SILVER');
    });

    it('should return appropriate recommendations for Gold tier', async () => {
      const mockUser = {
        id: '1',
        subscriptionTier: SubscriptionTier.GOLD,
        preferences: {
          danceStyles: ['Contemporary'],
          skillLevel: 'INTERMEDIATE',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const recommendations = await service.getRecommendations('1');

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].subscriptionRequired).toBe('GOLD');
    });

    it('should return appropriate recommendations for Platinum tier', async () => {
      const mockUser = {
        id: '1',
        subscriptionTier: SubscriptionTier.PLATINUM,
        preferences: {
          danceStyles: ['Ballet'],
          skillLevel: 'ADVANCED',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const recommendations = await service.getRecommendations('1');

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].subscriptionRequired).toBe('PLATINUM');
    });
  });

  describe('generateLearningPath', () => {
    it('should generate a learning path based on user goals', async () => {
      const mockUser = {
        id: '1',
        subscriptionTier: SubscriptionTier.GOLD,
        preferences: {
          danceStyles: ['Hip Hop'],
          skillLevel: 'INTERMEDIATE',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const learningPath = await service.generateLearningPath({
        userId: '1',
        goals: ['Master Hip Hop Basics'],
        timeFrame: '6 months',
      });

      expect(learningPath).toBeDefined();
      expect(learningPath.modules).toBeDefined();
      expect(learningPath.modules.length).toBeGreaterThan(0);
    });
  });

  describe('updateRecommendations', () => {
    it('should update recommendations when subscription changes', async () => {
      const mockUser = {
        id: '1',
        subscriptionTier: SubscriptionTier.SILVER,
        preferences: {
          danceStyles: ['Hip Hop'],
          skillLevel: 'BEGINNER',
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const updatedRecommendations = await service.updateRecommendations('1', {
        subscriptionTier: SubscriptionTier.GOLD,
      });

      expect(updatedRecommendations).toBeDefined();
      expect(updatedRecommendations.length).toBeGreaterThan(0);
      expect(updatedRecommendations[0].subscriptionRequired).toBe('GOLD');
    });
  });
}); 