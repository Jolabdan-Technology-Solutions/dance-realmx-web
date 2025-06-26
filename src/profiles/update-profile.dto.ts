import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsDate,
  IsJSON,
  Min,
  Max,
} from 'class-validator';

export class UpdateProfileDto {
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
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  travel_distance?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price_max?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  session_duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  years_experience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsArray()
  @IsDate({ each: true })
  availability?: Date[];

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricing?: number;

  // Existing fields
  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
