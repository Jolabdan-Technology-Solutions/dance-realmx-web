import { UserRole, SubscriptionTier } from '@prisma/client';

export class LoginResponseDto {
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: UserRole;
    profile_image_url: string | null;
    created_at: Date;
    updated_at: Date;
    subscription_tier: SubscriptionTier | null;
  };
  access_token: string;
  refresh_token?: string;
}
