import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonDto {
  @ApiPropertyOptional({ description: 'Title of the lesson' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Content of the lesson' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Video URL for the lesson' })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional({ description: 'Order of the lesson within the module' })
  @IsOptional()
  @IsInt()
  order?: number;
}
