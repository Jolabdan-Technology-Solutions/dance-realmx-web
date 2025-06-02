export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  profile_image_url: string | null;
  profileImageUrl?: string | null;
  auth_provider: string | null;
  created_at: Date;
  updated_at: Date;
  bio?: string | null;
  subscription_plan?: string | null;
  subscriptionPlan?: string | null;
  subscription_status?: string | null;
  subscriptionStatus?: string | null;
  subscription_expires_at?: Date | null;
  subscriptionExpiresAt?: Date | null;
} 