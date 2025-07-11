import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating (1-5)' })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  comment: string;

  @ApiProperty({ description: 'User ID' })
  @IsNumber()
  @IsInt()
  user_id: number;
}
