import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from './enums/role.enum';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/register.dto';

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    profile_image_url: string | null;
    auth_provider: string | null;
    created_at: Date;
    updated_at: Date;
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

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: Omit<User, 'password'>): Promise<LoginResponse> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_image_url: user.profile_image_url,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        role: data.role || Role.STUDENT,
      },
    });

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.name);

    const { password, ...result } = user;
    return result;
  }
}
