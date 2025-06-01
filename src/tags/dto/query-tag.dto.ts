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

export enum TagSortBy {
  NAME = 'name',
  CREATED_AT = 'created_at',
  COURSE_COUNT = 'course_count',
}

export class QueryTagDto {
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
  @IsEnum(TagSortBy)
  sort_by?: TagSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_courses?: boolean;
}
