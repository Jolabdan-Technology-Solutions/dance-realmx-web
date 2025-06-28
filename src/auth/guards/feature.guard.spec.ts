import { FeatureGuard } from './feature.guard';
import { Feature } from '../enums/feature.enum';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

// Mock Reflector
const mockReflector = {
  get: jest.fn(),
};

describe('FeatureGuard', () => {
  let guard: FeatureGuard;
  let mockContext: Partial<ExecutionContext>;

  beforeEach(() => {
    guard = new FeatureGuard(mockReflector as any);
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 1,
            roles: ['ADMIN'],
            subscription_tier: 'IMPERIAL',
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  });

  it('should allow access if user has required feature', () => {
    mockReflector.get.mockReturnValue(Feature.MANAGE_COURSES);
    expect(guard.canActivate(mockContext as ExecutionContext)).toBe(true);
  });

  it('should allow access if user has any role with the feature', () => {
    mockReflector.get.mockReturnValue(Feature.PURCHASE_CURRICULUM);
    mockContext.switchToHttp = () => ({
      getRequest: () => ({
        user: {
          id: 2,
          roles: ['STUDENT', 'GUEST_USER'],
          subscription_tier: 'FREE',
        },
      }),
    });
    expect(guard.canActivate(mockContext as ExecutionContext)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks feature', () => {
    mockReflector.get.mockReturnValue(Feature.MANAGE_COURSES);
    mockContext.switchToHttp = () => ({
      getRequest: () => ({
        user: {
          id: 3,
          roles: ['STUDENT'],
          subscription_tier: 'FREE',
        },
      }),
    });
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException if user is missing', () => {
    mockReflector.get.mockReturnValue(Feature.MANAGE_COURSES);
    mockContext.switchToHttp = () => ({
      getRequest: () => ({}),
    });
    expect(() => guard.canActivate(mockContext as ExecutionContext)).toThrow(
      ForbiddenException,
    );
  });

  it('should allow admin for any feature', () => {
    mockReflector.get.mockReturnValue(Feature.MANAGE_FEATURE_FLAGS);
    mockContext.switchToHttp = () => ({
      getRequest: () => ({
        user: {
          id: 4,
          roles: ['ADMIN'],
          subscription_tier: 'FREE',
        },
      }),
    });
    expect(guard.canActivate(mockContext as ExecutionContext)).toBe(true);
  });
});
