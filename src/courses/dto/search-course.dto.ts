import {
  IsOptional,
  IsNumber,
  IsInt,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCourseDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Instructor ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  instructor_id?: number;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Category IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids?: number[];

  @ApiPropertyOptional({ description: 'Tag IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tag_ids?: number[];

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sort_by?: 'price' | 'rating' | 'created_at' | 'popularity';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';
}
