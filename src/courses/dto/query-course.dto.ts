import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CourseSortBy {
  CREATED_AT = 'created_at',
  PRICE = 'price',
  RATING = 'rating',
  POPULARITY = 'popularity',
}

export class QueryCourseDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Instructor ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  instructor_id?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Category IDs' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  category_ids?: number[];

  @ApiPropertyOptional({ description: 'Tag IDs' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  tag_ids?: number[];

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsEnum(CourseSortBy)
  sort_by?: CourseSortBy;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;
}
