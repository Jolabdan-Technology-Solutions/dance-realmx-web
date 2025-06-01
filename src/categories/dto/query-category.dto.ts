import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '../../courses/dto/query-course.dto';

export enum CategorySortBy {
  NAME = 'name',
  CREATED_AT = 'created_at',
  COURSE_COUNT = 'course_count',
}

export class QueryCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsEnum(CategorySortBy)
  sort_by?: CategorySortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_courses?: boolean;
}
