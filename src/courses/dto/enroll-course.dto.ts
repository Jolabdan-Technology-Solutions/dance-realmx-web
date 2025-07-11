import { IsNumber, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollCourseDto {
  @ApiProperty({ description: 'User ID' })
  @IsNumber()
  @IsInt()
  user_id: number;

  @ApiPropertyOptional({ description: 'Payment ID' })
  @IsOptional()
  @IsNumber()
  @IsInt()
  payment_id?: number;
}
