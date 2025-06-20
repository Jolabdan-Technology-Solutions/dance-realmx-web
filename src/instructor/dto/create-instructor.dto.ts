import { IsString, IsEmail, IsOptional, IsUrl } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  profile_image_url?: string;
}
