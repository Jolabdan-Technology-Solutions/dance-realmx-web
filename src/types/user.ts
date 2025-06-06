export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'SELLER' | 'USER';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  profileImageUrl?: string;
  stripeAccountId?: string;
  stripeAccountStatus?: 'PENDING' | 'ACTIVE' | 'DEAUTHORIZED';
  accountType?: 'INSTRUCTOR' | 'SELLER';
  createdAt: string;
  updatedAt: string;
} 