import { UserRole } from '@prisma/client';

export class LoginResponseDto {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    created_at: Date;
    updated_at: Date;
  };
  access_token: string;
}
