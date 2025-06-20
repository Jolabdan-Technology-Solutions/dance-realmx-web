import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export enum ResourceType {
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  danceStyle?: string;

  @IsString()
  @IsOptional()
  ageRange?: string;

  @IsString()
  @IsOptional()
  difficultyLevel?: string;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
