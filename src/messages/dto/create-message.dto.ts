import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  sender_id: number;

  @IsNumber()
  receiver_id: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
