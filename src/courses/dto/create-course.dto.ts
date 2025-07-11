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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Title of the course' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the course' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Price of the course' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Short name of the course' })
  @IsString()
  @IsNotEmpty()
  short_name: string;

  @ApiProperty({ description: 'Detailed description of the course' })
  @IsString()
  @IsNotEmpty()
  detailed_description: string;

  @ApiProperty({ description: 'Category ID' })
  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @ApiProperty({ description: 'Duration of the course' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({ description: 'Visibility of the course' })
  @IsBoolean()
  @IsOptional()
  visible: boolean = true;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiProperty({ description: 'Video URL' })
  @IsString()
  @IsNotEmpty()
  video_url: string;

  @ApiProperty({ description: 'Preview video URL' })
  @IsString()
  @IsNotEmpty()
  preview_video_url: string;

  @ApiProperty({ description: 'Difficulty level' })
  @IsString()
  @IsNotEmpty()
  difficulty_level: string;

  @ApiProperty({ description: 'Instructor ID' })
  @IsNumber()
  @IsNotEmpty()
  instructor_id: number;
}
