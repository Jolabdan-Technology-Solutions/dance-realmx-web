export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BookingType = 'PRIVATE_LESSON' | 'GROUP_CLASS' | 'WORKSHOP' | 'EVENT';

export interface Location {
  type: 'ONLINE' | 'IN_PERSON';
  address?: string;
  onlineMeetingLink?: string;
}

export interface Booking {
  id: string;
  professionalId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: BookingStatus;
  price: number;
  location: Location;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingAvailability {
  id: string;
  professionalId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSettings {
  id: string;
  professionalId: string;
  minNoticeHours: number;
  maxAdvanceDays: number;
  cancellationPolicy: {
    allowedUntilHours: number;
    refundPercentage: number;
  };
  bufferTime: number; // in minutes
  defaultDuration: number; // in minutes
  defaultPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  professionalId: string;
  startTime: string;
  duration: number;
  type: string;
  location: Location;
  notes?: string;
}

export interface BookingResponse {
  booking: Booking;
  message: string;
}

export interface AvailabilityRequest {
  professionalId: string;
  startDate: string;
  endDate: string;
}

export interface AvailabilityResponse {
  availableSlots: {
    startTime: string;
    endTime: string;
  }[];
} 