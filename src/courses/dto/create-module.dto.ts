import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ description: 'Title of the module' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the module' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Course ID to which this module belongs' })
  @IsInt()
  course_id: number;

  @ApiProperty({ description: 'Order of the module within the course' })
  @IsInt()
  order: number;
}
