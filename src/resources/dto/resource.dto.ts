import { ApiProperty } from '@nestjs/swagger';

export class ResourceDto {
  @ApiProperty({ description: 'The unique identifier of the resource' })
  id: number;

  @ApiProperty({ description: 'The title of the resource' })
  title: string;

  @ApiProperty({ description: 'The description of the resource' })
  description: string;

  @ApiProperty({ description: 'The price of the resource' })
  price: number;

  @ApiProperty({
    description: 'The age range for the resource',
    required: false,
  })
  ageRange?: string;

  @ApiProperty({
    description: 'The category ID of the resource',
    required: false,
  })
  categoryId?: number;

  @ApiProperty({
    description: 'The dance style of the resource',
    required: false,
  })
  danceStyle?: string;

  @ApiProperty({
    description: 'The difficulty level of the resource',
    required: false,
  })
  difficultyLevel?: string;

  @ApiProperty({ description: 'The ID of the seller' })
  sellerId: number;

  @ApiProperty({
    description: 'The thumbnail URL of the resource',
    required: false,
  })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'The type of the resource' })
  type: string;

  @ApiProperty({ description: 'The URL of the resource' })
  url: string;

  @ApiProperty({ description: 'The creation date of the resource' })
  created_at: Date;

  @ApiProperty({ description: 'The last update date of the resource' })
  updated_at: Date;
}
