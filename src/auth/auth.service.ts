import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from './enums/role.enum';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    frequency: string | null;
    is_active: boolean | null;
    subscription_tier: string | null;
    role: string[];
    profile_image_url: string | null;
    auth_provider: string | null;
    created_at: Date;
    updated_at: Date;
    role_mappings: any[];
  };
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role_mappings: true,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>): Promise<LoginResponse> {
    // Fetch user with role mappings
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role_mappings: true,
      },
    });

    if (!userWithRoles) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        frequency: user.frequency,
        is_active: user.is_active,
        subscription_tier: user.subscription_tier,
        role: user.role as string[],
        profile_image_url: user.profile_image_url,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role_mappings: userWithRoles.role_mappings,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role || UserRole.STUDENT,
      },
    });

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.username);

    const { password, ...result } = user;
    return result;
  }
}
