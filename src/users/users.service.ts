import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole[];
  profile_image_url: string | null;
  created_at: Date;
  updated_at: Date;
  subscription_tier: string | null;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        subscription_tier: true,
      },
    });
  }

  async findOne(id: number): Promise<UserResponse | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        subscription_tier: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async update(id: number, data: Partial<User>): Promise<UserResponse> {
    // If password is being updated, hash it
    if (data.password) {
      const saltRounds = 12;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        subscription_tier: true,
      },
    });

    return user;
  }

  async delete(id: number): Promise<UserResponse> {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        role: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        subscription_tier: true,
      },
    });
  }
}
