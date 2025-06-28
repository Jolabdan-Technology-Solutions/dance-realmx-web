import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

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
  service_category?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dance_style?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  travel_distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_max?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricing?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  session_duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  years_experience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
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
