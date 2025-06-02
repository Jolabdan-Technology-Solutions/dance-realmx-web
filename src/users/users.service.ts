import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
import { LoginResponseDto } from './dto/login-response-dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findAll(): Promise<User[]> {
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

  async findOne(id: number): Promise<User | null> {
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

  async create(data: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmailOrUsername(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      console.log('[LOGIN] Attempting login for:', loginDto.username);
      // Find user by email or username
      const user = await this.findByEmailOrUsername(loginDto.username);

      if (!user) {
        console.error('[LOGIN] User not found:', loginDto.username);
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!user.password) {
        console.error('[LOGIN] User has no password set:', loginDto.username);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        console.error('[LOGIN] Invalid password for user:', loginDto.username);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };
      const access_token = await this.jwtService.signAsync(payload);

      // Return user info and token
      const { password, ...userInfo } = user;

      console.log('[LOGIN] Successful login for:', loginDto.username);
      return {
        user: userInfo,
        access_token,
      };
    } catch (err) {
      console.error('[LOGIN] Unexpected error during login:', err);
      throw err;
    }
  }

  async update(id: number, data: Partial<User>): Promise<User> {
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

  async delete(id: number): Promise<User> {
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
        // Exclude password from results
      },
    });
  }
}
