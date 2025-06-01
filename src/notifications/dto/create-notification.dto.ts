import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateNotificationDto {
  @IsNumber()
  user_id: number;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsObject()
  data?: any;
}
