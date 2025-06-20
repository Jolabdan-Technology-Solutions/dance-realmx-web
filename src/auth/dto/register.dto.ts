// dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
<<<<<<< HEAD
=======
  IsArray,
>>>>>>> dev-backend
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
<<<<<<< HEAD
=======
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

>>>>>>> dev-backend
  @IsEmail()
  email: string;

  @IsString()
<<<<<<< HEAD
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  auth_provider?: string;

  @IsOptional()
  @IsString()
  subscription_tier?: string;

  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  profile_image_url?: string;
=======
  @IsOptional()
  profile_image_url?: string;

  @IsString()
  @IsOptional()
  auth_provider?: string;

  @IsArray()
  @IsOptional()
  @IsEnum(UserRole, { each: true })
  role?: string[];
>>>>>>> dev-backend
}
