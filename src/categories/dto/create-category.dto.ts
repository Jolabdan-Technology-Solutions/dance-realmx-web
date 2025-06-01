import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  parent_id?: number;
}
