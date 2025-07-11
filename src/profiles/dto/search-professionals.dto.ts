import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DateRangeDto } from '../update-profile.dto';

export class SearchProfessionalsDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsBoolean()
  is_professional?: boolean;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v) => v.trim())
      : Array.isArray(value)
        ? value
        : [],
  )
  service_category?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v) => v.trim())
      : Array.isArray(value)
        ? value
        : [],
  )
  dance_style?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  travel_distance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_max?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricing?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  session_duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  years_experience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v) => v.trim())
      : Array.isArray(value)
        ? value
        : [],
  )
  services?: string[];

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsOptional()
  @IsDateString()
  date_start?: string;

  @IsOptional()
  @IsDateString()
  date_end?: string;

  @IsOptional()
  @IsString()
  time_slot?: string; // e.g., "09:00-10:00"

  @IsOptional()
  @IsDateString()
  preferred_date?: string; // e.g., "2024-01-15"

  @IsOptional()
  @IsString()
  preferred_time_slot?: string; // e.g., "09:00-10:00"

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateRangeDto)
  availability?: DateRangeDto[];

  // Support for frontend availability format
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  availability_dates?: string[]; // e.g., ["2025-07-02", "2025-07-03"]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  availability_time_slots?: string[]; // e.g., ["09:00-10:00", "11:00-12:00"]

  // Support for nested availability format from frontend
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  availability_data?: Array<{
    date: string;
    time_slots: string[];
  }>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
