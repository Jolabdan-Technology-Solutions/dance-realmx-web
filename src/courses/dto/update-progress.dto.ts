import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber()
  @IsInt()
  lesson_id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress_percentage?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  time_spent_seconds?: number;
}
