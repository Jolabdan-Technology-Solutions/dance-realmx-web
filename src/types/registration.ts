export type Step = "features" | "planRecommendation" | "accountCreation" | "payment" | "confirmation";

export type FeatureCategory = "instructor" | "student" | "seller" | "connect";

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  icon?: string;
}

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface AccountFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  selectedRoles: string[];
}

export interface RegistrationData {
  selectedFeatures: string[];
  recommendedPlan: SubscriptionPlanOption | null;
  accountData: AccountFormData | null;
  paymentCompleted: boolean;
  paymentMethod?: "yearly" | "monthly";
  paymentSessionId?: string;
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