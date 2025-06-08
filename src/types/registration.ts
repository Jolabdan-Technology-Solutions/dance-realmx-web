export type Step = "features" | "planRecommendation" | "accountCreation";

export type FeatureCategory = "instructor" | "student" | "seller" | "connect";

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  icon: string;
}

export interface SubscriptionPlanOption {
  id: number;
  name: string;
  slug: string;
  description: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  isPopular: boolean;
  isActive: boolean;
  isStandalone: boolean;
  planType: string;
  featureDetails: any;
  unlockedRoles: string[];
  tier: string;
}

export interface AccountFormData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  selected_roles: string[];
}

export interface RegistrationData {
  selectedFeatures: string[];
  paymentMethod: string;
  recommendedPlan: SubscriptionPlanOption | null;
  accountData: AccountFormData | null;
  paymentCompleted: boolean;
}

export interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  dance_styles: string[];
  experience_years?: number;
  teaching_credentials?: string;
  seller_bio?: string;
  recommended_plan: SubscriptionPlanOption | null;
}
