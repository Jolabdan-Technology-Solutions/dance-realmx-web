import { PrismaClient } from '@prisma/client';

async function updateSubscriptionPlans() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error']
  });

  try {
    // Update Free Plan
    await prisma.subscriptionPlan.upsert({
      where: { slug: 'free' },
      update: {
        name: 'Free',
        description: 'Basic access to the platform',
        features: ['Basic access', 'Limited content'],
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
        tier: 'FREE',
        unlockedRoles: ['GUEST_USER'],
      },
      create: {
        slug: 'free',
        name: 'Free',
        description: 'Basic access to the platform',
        features: ['Basic access', 'Limited content'],
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
        tier: 'FREE',
        unlockedRoles: ['GUEST_USER'],
      },
    });

    // Update Silver Plan
    await prisma.subscriptionPlan.upsert({
      where: { slug: 'silver' },
      update: {
        name: 'Silver',
        description: 'Enhanced features and content access',
        features: [
          'All Free features',
          'Access to premium content',
          'Basic support',
        ],
        priceMonthly: 9.99,
        priceYearly: 99.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_SILVER_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_SILVER_YEARLY,
        isActive: true,
        tier: 'SILVER',
        unlockedRoles: ['STUDENT', 'BOOKING_USER'],
      },
      create: {
        slug: 'silver',
        name: 'Silver',
        description: 'Enhanced features and content access',
        features: [
          'All Free features',
          'Access to premium content',
          'Basic support',
        ],
        priceMonthly: 9.99,
        priceYearly: 99.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_SILVER_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_SILVER_YEARLY,
        isActive: true,
        tier: 'SILVER',
        unlockedRoles: ['STUDENT', 'BOOKING_USER'],
      },
    });

    // Update Gold Plan
    await prisma.subscriptionPlan.upsert({
      where: { slug: 'gold' },
      update: {
        name: 'Gold',
        description: 'Professional features and priority support',
        features: [
          'All Silver features',
          'Priority support',
          'Advanced content access',
          'Early access to new features',
        ],
        priceMonthly: 19.99,
        priceYearly: 199.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_GOLD_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_GOLD_YEARLY,
        isActive: true,
        tier: 'GOLD',
        unlockedRoles: ['STUDENT', 'BOOKING_USER', 'CURRICULUM_SELLER'],
      },
      create: {
        slug: 'gold',
        name: 'Gold',
        description: 'Professional features and priority support',
        features: [
          'All Silver features',
          'Priority support',
          'Advanced content access',
          'Early access to new features',
        ],
        priceMonthly: 19.99,
        priceYearly: 199.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_GOLD_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_GOLD_YEARLY,
        isActive: true,
        tier: 'GOLD',
        unlockedRoles: ['STUDENT', 'BOOKING_USER', 'CURRICULUM_SELLER'],
      },
    });

    // Update Platinum Plan
    await prisma.subscriptionPlan.upsert({
      where: { slug: 'platinum' },
      update: {
        name: 'Platinum',
        description: 'Complete access to all features and premium support',
        features: [
          'All Gold features',
          'Premium support',
          'Full content access',
          'Custom features',
          'Priority booking',
        ],
        priceMonthly: 29.99,
        priceYearly: 299.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_PLATINUM_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_PLATINUM_YEARLY,
        isActive: true,
        tier: 'PLATINUM',
        unlockedRoles: [
          'STUDENT',
          'BOOKING_USER',
          'CURRICULUM_SELLER',
          'INSTRUCTOR_ADMIN',
        ],
      },
      create: {
        slug: 'platinum',
        name: 'Platinum',
        description: 'Complete access to all features and premium support',
        features: [
          'All Gold features',
          'Premium support',
          'Full content access',
          'Custom features',
          'Priority booking',
        ],
        priceMonthly: 29.99,
        priceYearly: 299.99,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_PLATINUM_MONTHLY,
        stripePriceIdYearly: process.env.STRIPE_PRICE_PLATINUM_YEARLY,
        isActive: true,
        tier: 'PLATINUM',
        unlockedRoles: [
          'STUDENT',
          'BOOKING_USER',
          'CURRICULUM_SELLER',
          'INSTRUCTOR_ADMIN',
        ],
      },
    });

    console.log('Subscription plans updated successfully');
  } catch (error) {
    console.error('Error updating subscription plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSubscriptionPlans().catch(console.error); 