import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ description: 'Title of the lesson' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content of the lesson' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Video URL for the lesson' })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiProperty({ description: 'Module ID to which this lesson belongs' })
  @IsInt()
  module_id: number;

  @ApiProperty({ description: 'Order of the lesson within the module' })
  @IsInt()
  order: number;
}
