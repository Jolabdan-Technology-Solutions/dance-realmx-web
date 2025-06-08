import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, $Enums } from '@prisma/client';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
import { LoginResponseDto } from './dto/login-response-dto';
import { UpdateUserDto } from './dto/update-user-dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        role_mappings: true,
      },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role_mappings: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role_mappings: true,
      },
    });
  }

  async findByName(name: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { name },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { name: identifier }],
      },
    });
  }

  async create(data: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: [UserRole.GUEST_USER],
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await this.prisma.userRoleMapping.create({
      data: {
        user_id: user.id,
        role: UserRole.GUEST_USER,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const createdUser = await this.findOne(user.id);
    if (!createdUser) {
      throw new Error('Failed to create user');
    }
    return createdUser;
  }

  async login(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role_mappings: true,
      },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.first_name,
        image: user.profile_image_url,
        role: user.role[0],
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async update(id: number, data: any): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        role_mappings: true,
      },
    });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserRoles(userId: number): Promise<string[]> {
    const roleMappings = await this.prisma.userRoleMapping.findMany({
      where: { user_id: userId },
      select: { role: true },
    });
    return roleMappings.map((mapping) => mapping.role);
  }

  async hasRole(userId: number, role: UserRole): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role_mappings: true,
      },
    });

    if (!user) return false;

    return user.role_mappings.some((mapping) => mapping.role === role);
  }

  async isAdmin(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.ADMIN);
  }

  async isCurriculumAdmin(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.CURRICULUM_ADMIN);
  }

  async isInstructorAdmin(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.INSTRUCTOR_ADMIN);
  }

  async isCourseCreatorAdmin(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.COURSE_CREATOR_ADMIN);
  }

  async isCurriculumOfficer(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.CURRICULUM_ADMIN);
  }

  async isInstructor(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.CURRICULUM_SELLER);
  }

  async isSeller(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.CURRICULUM_SELLER);
  }

  async isCourseCreator(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.COURSE_CREATOR_ADMIN);
  }

  async isCertificationManager(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.CERTIFICATION_MANAGER);
  }

  async isDirectoryMember(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.DIRECTORY_MEMBER);
  }

  async isBookingProfessional(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.BOOKING_USER);
  }

  async isBookingUser(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.BOOKING_USER);
  }

  async isStudent(userId: number): Promise<boolean> {
    return this.hasRole(userId, UserRole.STUDENT);
  }
}
