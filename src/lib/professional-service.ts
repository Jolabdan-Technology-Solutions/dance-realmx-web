import { apiRequest } from "./queryClient";

export interface ProfessionalProfile {
  id: number;
  userId: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  providerType: string | null;
  danceStyles: string[] | null;
  location: string | null;
  rate: string | null;
  availability: string | null;
  bio: string | null;
  yearsExperience: number | null;
  services: string[] | null;
  rating: number | null;
  reviewCount: number | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  travelDistance: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sessionDuration: number | null;
  portfolio: string | null;
  phoneNumber: string | null;
  address: string | null;
  country: string | null;
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
}

export interface ProfessionalSearchResponse {
  results: ProfessionalProfile[];
  total: number;
  page: number;
  limit: number;
}

class ProfessionalService {
  private baseUrl = "https://api.livetestdomain.com/api/profiles/professionals";

  // Get professionals by category
  async getByCategory(category: string): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-category?category=${encodeURIComponent(category)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Get professionals by city
  async getByCity(city: string): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-city?city=${encodeURIComponent(city)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Get professionals by dance style
  async getByDanceStyle(
    danceStyle: string
  ): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-dance-style?danceStyle=${encodeURIComponent(danceStyle)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Get professionals by date
  async getByDate(date: string): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-date?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Get professionals by location
  async getByLocation(location: string): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-location?location=${encodeURIComponent(location)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Get professionals by pricing
  async getByPricing(
    minPrice?: number,
    maxPrice?: number
  ): Promise<ProfessionalSearchResponse> {
    const params = new URLSearchParams();
    if (minPrice !== undefined) params.append("price_min", minPrice.toString());
    if (maxPrice !== undefined) params.append("price_max", maxPrice.toString());

    return apiRequest(`${this.baseUrl}/by-pricing?${params.toString()}`, {
      method: "GET",
      requireAuth: true,
    });
  }

  // Get professionals by state
  async getByState(state: string): Promise<ProfessionalSearchResponse> {
    return apiRequest(
      `${this.baseUrl}/by-state?state=${encodeURIComponent(state)}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }

  // Search professionals with multiple criteria
  async search(
    params: ProfessionalSearchParams
  ): Promise<ProfessionalSearchResponse> {
    const searchParams = new URLSearchParams();

    // Add all parameters to the search
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, item));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return apiRequest(`${this.baseUrl}/search?${searchParams.toString()}`, {
      method: "GET",
      requireAuth: true,
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
    return apiRequest(
      `https://api.livetestdomain.com/api/profiles/${profileId}/book`,
      {
        method: "POST",
        data: bookingData,
        requireAuth: true,
      }
    );
  }

  // Add/remove professional from favorites
  async toggleFavorite(profileId: number): Promise<any> {
    return apiRequest(
      `https://api.livetestdomain.com/api/profiles/${profileId}/favorite`,
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
    return apiRequest(
      `https://api.livetestdomain.com/api/profiles/${profileId}`,
      {
        method: "GET",
        requireAuth: true,
      }
    );
  }
}

export const professionalService = new ProfessionalService();
