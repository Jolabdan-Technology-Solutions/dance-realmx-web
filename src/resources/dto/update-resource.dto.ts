import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsString()
  danceStyle?: string;

  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsUrl()
  url?: string;
}
