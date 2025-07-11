import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateQuizOptionDto {
  @ApiProperty({ description: 'Option text' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Whether this option is correct' })
  @IsOptional()
  @IsBoolean()
  is_correct?: boolean;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  text: string;

  @ApiProperty({
    type: [CreateQuizOptionDto],
    description: 'List of options for the question',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  @ArrayMinSize(2)
  options: CreateQuizOptionDto[];

  @ApiPropertyOptional({ description: 'Index of the correct answer (0-based)' })
  @IsOptional()
  @IsInt()
  answer?: number;

  @ApiPropertyOptional({ description: 'Order of the question in the quiz' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz title' })
  @IsString()
  title: string;

  @ApiProperty({
    type: [CreateQuizQuestionDto],
    description: 'List of questions in the quiz',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuizQuestionDto[];
}
