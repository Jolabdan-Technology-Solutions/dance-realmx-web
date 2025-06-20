import { PrismaClient, UserRole, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'General Account',
    features: [
      'Profile Listing in Directory',
      'Basic Dashboard Access'
    ],
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
    isPopular: false,
    planType: 'main',
    tier: SubscriptionTier.FREE,
    unlockedRoles: [UserRole.DIRECTORY_MEMBER],
  },
  {
    name: 'Nobility',
    slug: 'nobility',
    description: 'Royal - Silver',
    features: [
      'Profile Listing in Directory',
      'Basic Dashboard Access',
      'Sell Classes or Products',
      'Upload Curriculum',
      'Manage Courses',
      'Add PDFs, Videos, Worksheets',
      'Bookings Management',
      'Stripe Payout Integration',
      'Store Tab in Dashboard',
      'Curriculum Tab in Dashboard'
    ],
    priceMonthly: 10,
    priceYearly: 100,
    isActive: true,
    isPopular: true,
    planType: 'main',
    tier: SubscriptionTier.NOBILITY,
    unlockedRoles: [UserRole.DIRECTORY_MEMBER, UserRole.CURRICULUM_SELLER],
  },
  {
    name: 'Royal',
    slug: 'royal',
    description: 'Royal - Royal',
    features: [
      'All Silver Features',
      'Access to Certification Tools',
      'Create Certification Tracks',
      'Manage Assessments and Students',
      'Certifications Tab in Dashboard'
    ],
    priceMonthly: 25,
    priceYearly: 250,
    isActive: true,
    isPopular: false,
    planType: 'main',
    tier: SubscriptionTier.ROYAL,
    unlockedRoles: [
      UserRole.DIRECTORY_MEMBER,
      UserRole.CURRICULUM_SELLER,
      UserRole.CERTIFICATION_MANAGER
    ],
  },
  {
    name: 'Imperial',
    slug: 'imperial',
    description: 'Royal - Imperial',
    features: [
      'All Gold Features',
      'Admin Dashboard',
      'User Role Management',
      'Contract Handling',
      'Payment Oversight',
      'Full Oversight Access'
    ],
    priceMonthly: 50,
    priceYearly: 500,
    isActive: true,
    isPopular: false,
    planType: 'main',
    tier: SubscriptionTier.IMPERIAL,
    unlockedRoles: [
      UserRole.DIRECTORY_MEMBER,
      UserRole.CURRICULUM_SELLER,
      UserRole.CERTIFICATION_MANAGER,
      UserRole.ADMIN
    ],
  }
];

async function main() {
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 