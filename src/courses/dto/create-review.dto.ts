import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsNumber()
  @IsInt()
  user_id: number;
}
