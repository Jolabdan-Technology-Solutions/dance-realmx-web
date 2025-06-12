import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  short_name: string;

  @IsString()
  @IsNotEmpty()
  detailed_description: string;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsBoolean()
  @IsOptional()
  visible: boolean = true;

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsString()
  @IsNotEmpty()
  video_url: string;

  @IsString()
  @IsNotEmpty()
  preview_video_url: string;

  @IsString()
  @IsNotEmpty()
  difficulty_level: string;

  @IsNumber()
  @IsNotEmpty()
  instructor_id: number;
}
