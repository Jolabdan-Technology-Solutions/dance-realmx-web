import { IsString, IsOptional} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}
