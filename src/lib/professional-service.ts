import { apiRequest } from "./queryClient";

export interface ProfessionalProfile {
  id: number;
  user_id: number;
  user: {
    id: number;
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  providerType?: string | null;
  dance_style: string[];
  location: string | null;
  rate?: string | null;
  availability: string | null;
  bio: string | null;
  years_experience: number;
  service_category: string[];
  services: string[];
  rating?: number | null;
  reviewCount?: number | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  travel_distance: number | null;
  price_min: number | null;
  price_max: number | null;
  session_duration: number | null;
  portfolio: string | null;
  phone_number: string | null;
  address: string | null;
  country: string | null;
  pricing: number | null;
  is_professional: boolean;
  is_verified: boolean;
}

export interface ProfessionalSearchParams {
  service_category?: string[];
  dance_style?: string[];
  zip_code?: string;
  city?: string;
  state?: string;
  location?: string;
  travel_distance?: number;
  pricing?: number;
  session_duration?: number;
  date?: string;
  price_min?: number;
  price_max?: number;
  availability_dates?: string[];
  availability_data?: Array<{
    date: string;
    time_slots: string[];
  }>;
}

export interface ProfessionalSearchResponse {
  results: ProfessionalProfile[];
  total: number;
  page: number;
  limit: number;
}

class ProfessionalService {
  private baseUrl = "/api/profiles/professionals";

  // Get professionals by category
  async getByCategory(category: string): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-category?category=${encodeURIComponent(category)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by city
  async getByCity(city: string): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-city?city=${encodeURIComponent(city)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by dance style
  async getByDanceStyle(
    danceStyle: string
  ): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-dance-style?danceStyle=${encodeURIComponent(danceStyle)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by date
  async getByDate(date: string): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-date?date=${encodeURIComponent(date)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by location
  async getByLocation(location: string): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-location?location=${encodeURIComponent(location)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by pricing
  async getByPricing(
    minPrice?: number,
    maxPrice?: number
  ): Promise<ProfessionalSearchResponse> {
    const params = new URLSearchParams();
    if (minPrice !== undefined) params.append("price_min", minPrice.toString());
    if (maxPrice !== undefined) params.append("price_max", maxPrice.toString());

    const url = `/api/profiles/professionals/by-pricing?${params.toString()}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Get professionals by state
  async getByState(state: string): Promise<ProfessionalSearchResponse> {
    const url = `/api/profiles/professionals/by-state?state=${encodeURIComponent(state)}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }

  // Search professionals with multiple criteria
  async search(
    params: ProfessionalSearchParams
  ): Promise<ProfessionalSearchResponse> {
    delete params.availability_dates;

    return await apiRequest(`/api/profiles/professionals/search`, {
      method: "POST",
      requireAuth: true,
      data: params,
    });
  }

  // Get professional recommendations based on user preferences
  async getRecommendations(
    userPreferences: ProfessionalSearchParams
  ): Promise<ProfessionalSearchResponse> {
    return this.search(userPreferences);
  }

  // Book a professional
  async bookProfessional(profileId: number, bookingData: any): Promise<any> {
    return await apiRequest(
      `/api/profiles/${profileId}/book`,
      {
        method: "POST",
        data: bookingData,
        requireAuth: true,
      }
    );
  }

  // Add/remove professional from favorites
  async toggleFavorite(profileId: number): Promise<any> {
    return await apiRequest(
      `/api/profiles/${profileId}/favorite`,
      {
        method: "POST",
        requireAuth: true,
      }
    );
  }

  // Get professional details
  async getProfessionalDetails(
    profileId: number
  ): Promise<ProfessionalProfile> {
    const url = `/api/profiles/${profileId}`;
    const response = await apiRequest(url, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  }
}

export const professionalService = new ProfessionalService();
