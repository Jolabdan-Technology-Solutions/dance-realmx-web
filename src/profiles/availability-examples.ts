import { DateRangeDto } from './update-profile.dto';

// Example availability structures for professionals

export const availabilityExamples = {
  // Example 1: Weekly availability for a month
  weeklyAvailability: [
    {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      time_slots: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
    },
  ] as DateRangeDto[],

  // Example 2: Specific date ranges with different time slots
  specificRanges: [
    {
      start_date: '2024-01-15',
      end_date: '2024-01-20',
      time_slots: ['09:00-10:00', '14:00-15:00'],
    },
    {
      start_date: '2024-01-25',
      end_date: '2024-01-30',
      time_slots: ['10:00-11:00', '15:00-16:00', '16:00-17:00'],
    },
  ] as DateRangeDto[],

  // Example 3: Weekend availability
  weekendAvailability: [
    {
      start_date: '2024-01-06',
      end_date: '2024-01-07',
      time_slots: ['10:00-11:00', '11:00-12:00', '14:00-15:00'],
    },
    {
      start_date: '2024-01-13',
      end_date: '2024-01-14',
      time_slots: ['10:00-11:00', '11:00-12:00', '14:00-15:00'],
    },
  ] as DateRangeDto[],

  // Example 4: Evening availability
  eveningAvailability: [
    {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      time_slots: ['18:00-19:00', '19:00-20:00', '20:00-21:00'],
    },
  ] as DateRangeDto[],
};

// Helper function to validate date range format
export function validateDateRange(dateRange: DateRangeDto): boolean {
  const start = new Date(dateRange.start_date);
  const end = new Date(dateRange.end_date);

  // Check if start date is before end date
  if (start >= end) {
    return false;
  }

  // Check if time slots are in valid format (HH:MM-HH:MM)
  if (dateRange.time_slots) {
    const timeSlotRegex =
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return dateRange.time_slots.every((slot) => timeSlotRegex.test(slot));
  }

  return true;
}

// Helper function to check if a specific date and time is available
export function isAvailable(
  availability: DateRangeDto[],
  date: string,
  timeSlot?: string,
): boolean {
  const targetDate = new Date(date);

  return availability.some((range) => {
    const startDate = new Date(range.start_date);
    const endDate = new Date(range.end_date);

    // Check if date is within range
    if (targetDate < startDate || targetDate > endDate) {
      return false;
    }

    // If time slot is specified, check if it's available
    if (timeSlot && range.time_slots) {
      return range.time_slots.includes(timeSlot);
    }

    return true;
  });
}
