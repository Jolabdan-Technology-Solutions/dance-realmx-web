// dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsArray,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  subscription_tier?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  profile_image_url?: string;

  @IsString()
  @IsOptional()
  auth_provider?: string;

  @IsString()
  @IsOptional()
  planSlug?: string;
}
