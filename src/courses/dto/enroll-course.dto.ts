import { IsNumber, IsInt, IsOptional } from 'class-validator';

export class EnrollCourseDto {
  @IsNumber()
  @IsInt()
  user_id: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  payment_id?: number;
}
