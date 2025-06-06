export class CreateResourceDto {
  title: string;
  description: string;
  type: string;
  url: string;
  price: number;
  danceStyle?: string;
  ageRange?: string;
  difficultyLevel?: string;
  thumbnailUrl?: string;
  categoryId?: number;
} 