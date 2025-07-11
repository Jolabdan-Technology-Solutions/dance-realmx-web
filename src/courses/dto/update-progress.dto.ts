import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: 'Lesson ID' })
  @IsNumber()
  @IsInt()
  lesson_id: number;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress_percentage?: number;

  @ApiPropertyOptional({ description: 'Time spent in seconds' })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  time_spent_seconds?: number;
}
