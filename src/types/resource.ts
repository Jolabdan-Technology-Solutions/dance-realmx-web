export interface Resource {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  danceStyle?: string;
  difficultyLevel?: string;
  ageRange?: string;
  thumbnailUrl?: string;
  url: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
} 