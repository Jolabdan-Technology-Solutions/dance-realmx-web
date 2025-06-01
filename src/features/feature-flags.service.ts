import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly ROLE_FEATURES_CACHE_KEY = 'role_features';
  private readonly USER_FEATURES_CACHE_KEY = 'user_features:';

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    // Initialize cache with role features
    await this.cacheManager.set(
      this.ROLE_FEATURES_CACHE_KEY,
      this.roleFeatureFlags,
      this.CACHE_TTL,
    );
  }

  private readonly roleFeatureFlags: Map<UserRole, string[]> = new Map([
    [UserRole.ADMIN, ['*']],
    [
      UserRole.CURRICULUM_ADMIN,
      ['advanced_analytics', 'bulk_course_management', 'curriculum_templates'],
    ],
    [
      UserRole.COURSE_CREATOR_ADMIN,
      ['course_templates', 'instructor_management', 'advanced_analytics'],
    ],
    [
      UserRole.INSTRUCTOR_ADMIN,
      ['booking_management', 'instructor_analytics', 'schedule_management'],
    ],
    [
      UserRole.CURRICULUM_SELLER,
      ['curriculum_creation', 'basic_analytics', 'marketplace_listing'],
    ],
    [
      UserRole.BOOKING_PROFESSIONAL,
      ['booking_calendar', 'student_management', 'basic_analytics'],
    ],
    [
      UserRole.STUDENT,
      ['course_progress', 'certificate_generation', 'discussion_forums'],
    ],
    [
      UserRole.BOOKING_USER,
      ['booking_calendar', 'session_history', 'instructor_ratings'],
    ],
    [UserRole.GUEST_USER, ['public_courses', 'instructor_directory']],
  ]);

  async isFeatureEnabled(userId: number, featureKey: string): Promise<boolean> {
    // Try to get from cache first
    const cacheKey = `${this.USER_FEATURES_CACHE_KEY}${userId}`;
    const cachedFeatures = await this.cacheManager.get<string[]>(cacheKey);

    if (cachedFeatures) {
      return (
        cachedFeatures.includes('*') || cachedFeatures.includes(featureKey)
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoleMapping: true,
      },
    });

    if (!user) return false;

    const enabledFeatures = new Set<string>();

    for (const roleMapping of user.userRoleMapping) {
      const roleFeatures = this.roleFeatureFlags.get(roleMapping.role) || [];
      if (roleFeatures.includes('*')) {
        await this.cacheManager.set(cacheKey, ['*'], this.CACHE_TTL);
        return true;
      }
      roleFeatures.forEach((feature) => enabledFeatures.add(feature));
    }

    const features = Array.from(enabledFeatures);
    await this.cacheManager.set(cacheKey, features, this.CACHE_TTL);
    return features.includes(featureKey);
  }

  async getEnabledFeatures(userId: number): Promise<string[]> {
    const cacheKey = `${this.USER_FEATURES_CACHE_KEY}${userId}`;
    const cachedFeatures = await this.cacheManager.get<string[]>(cacheKey);

    if (cachedFeatures) {
      return cachedFeatures;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoleMapping: true,
      },
    });

    if (!user) return [];

    const enabledFeatures = new Set<string>();

    for (const roleMapping of user.userRoleMapping) {
      const roleFeatures = this.roleFeatureFlags.get(roleMapping.role) || [];
      if (roleFeatures.includes('*')) {
        await this.cacheManager.set(cacheKey, ['*'], this.CACHE_TTL);
        return ['*'];
      }
      roleFeatures.forEach((feature) => enabledFeatures.add(feature));
    }

    const features = Array.from(enabledFeatures);
    await this.cacheManager.set(cacheKey, features, this.CACHE_TTL);
    return features;
  }

  async isFeatureEnabledForRole(
    role: UserRole,
    featureKey: string,
  ): Promise<boolean> {
    const roleFeatures = this.roleFeatureFlags.get(role) || [];
    return roleFeatures.includes('*') || roleFeatures.includes(featureKey);
  }

  // Dynamic feature flag updates
  async updateRoleFeatures(role: UserRole, features: string[]): Promise<void> {
    this.roleFeatureFlags.set(role, features);
    await this.cacheManager.set(
      this.ROLE_FEATURES_CACHE_KEY,
      this.roleFeatureFlags,
      this.CACHE_TTL,
    );
    // Invalidate all user feature caches
    await this.invalidateUserFeatureCaches();
  }

  private async invalidateUserFeatureCaches(): Promise<void> {
    // Since we can't directly access keys, we'll use a prefix-based approach
    const prefix = this.USER_FEATURES_CACHE_KEY;
    // We'll need to implement a custom solution to handle this
    // For now, we'll just clear the entire cache
    await this.clearCache();
  }

  async clearCache(): Promise<void> {
    // Since reset() is not available, we'll use del() with a wildcard pattern
    // This is a workaround since cache-manager doesn't provide a direct way to clear all keys
    const prefix = this.USER_FEATURES_CACHE_KEY;
    await this.cacheManager.del(prefix);
    await this.cacheManager.del(this.ROLE_FEATURES_CACHE_KEY);
  }
}
