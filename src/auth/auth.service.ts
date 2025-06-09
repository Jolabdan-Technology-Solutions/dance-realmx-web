import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register.dto';
import { ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Role } from './enums/role.enum';

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
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RESET_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(
        loginDto.username,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { updated_at: new Date() },
      });

      const tokens = await this.generateTokens(user);
      this.logger.log(`User logged in: ${user.username}`);

      return {
        user: await this.formatUserResponse(user),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: createUserDto.email.toLowerCase().trim() },
            { username: createUserDto.username },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === createUserDto.email.toLowerCase().trim()) {
          throw new BadRequestException('Email already exists');
        }
        if (existingUser.username === createUserDto.username) {
          throw new BadRequestException('Username already exists');
        }
      }

      // Validate password strength
      if (createUserDto.password.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters long',
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          email: createUserDto.email.toLowerCase().trim(),
          password: hashedPassword,
          is_active: false, // Require email verification
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Send verification email
      await this.sendVerificationEmail(user.email);

      const tokens = await this.generateTokens(user);
      this.logger.log(`User registered: ${user.username}`);

      return {
        user: await this.formatUserResponse(user),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async validateUser(username: string, password: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username.toLowerCase().trim() }],
        },
        include: {
          role_mappings: {
            include: {
              role: true,
            },
          },
        },
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        const { password: _, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      this.logger.error(`Validate user error: ${error.message}`, error.stack);
      return null;
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      username: user.username,
      sub: user.id,
      email: user.email,
      roles: user.role_mappings?.map((rm) => rm.role.name) || [],
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      }),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }),
    };
  }

  private async formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      frequency: user.frequency,
      is_active: user.is_active,
      subscription_tier: user.subscription_tier,
      role: user.role_mappings?.map((rm) => rm.role.name) || [],
      profile_image_url: user.profile_image_url,
      auth_provider: user.auth_provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role_mappings: user.role_mappings || [],
    };
  }

  async logout(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // In a real implementation, you might want to blacklist the token
      // or store logout timestamp in database
      this.logger.log(`User logged out: ${user.username}`);

      return {
        message: 'User logged out successfully',
      };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Logout failed');
    }
  }

  async refreshToken(userId: number, refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.sub !== userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role_mappings: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);
      this.logger.log(`Token refreshed for user: ${user.username}`);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: await this.formatUserResponse(user),
      };
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Don't reveal if user exists or not for security
      if (!user) {
        this.logger.warn(
          `Password reset attempted for non-existent email: ${normalizedEmail}`,
        );
        return {
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      if (!user.is_active) {
        this.logger.warn(
          `Password reset attempted for inactive user: ${user.id}`,
        );
        return {
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Rate limiting check
      const recentAttempts = await this.prisma.passwordReset.findMany({
        where: {
          email: normalizedEmail,
          created_at: {
            gte: new Date(Date.now() - this.RATE_LIMIT_WINDOW),
          },
        },
      });

      if (recentAttempts >= this.MAX_RESET_ATTEMPTS) {
        this.logger.warn(
          `Rate limit exceeded for password reset: ${normalizedEmail}`,
        );
        throw new BadRequestException(
          'Too many reset attempts. Please try again later.',
        );
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, 12);
      const expiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRY);

      // Store reset token in database
      await this.prisma.passwordReset.create({
        data: {
          email: normalizedEmail,
          token: hashedToken,
          expires_at: expiresAt,
          user_id: user.id,
          created_at: new Date(),
        },
      });

      // Send reset email
      const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

      await this.mailService.sendPasswordResetEmail(normalizedEmail, resetUrl);

      this.logger.log(`Password reset email sent to: ${normalizedEmail}`);

      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to process password reset request');
    }
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    try {
      const { token, newPassword, email } = resetDto;
      // const normalizedEmail = email.toLowerCase().trim();

      // Find valid reset token
      const passwordReset = await this.prisma.passwordReset.findFirst({
        where: {
          email: email,
          expires_at: {
            gt: new Date(),
          },
          used_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!passwordReset) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Verify token
      const isValidToken = await bcrypt.compare(token, passwordReset.token);
      if (!isValidToken) {
        throw new BadRequestException('Invalid reset token');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (!user || !user.is_active) {
        throw new BadRequestException('User not found or inactive');
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters long',
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            updated_at: new Date(),
          },
        }),
        this.prisma.passwordReset.update({
          where: { id: passwordReset.id },
          data: { used_at: new Date() },
        }),
        // Invalidate all other reset tokens for this user
        this.prisma.passwordReset.updateMany({
          where: {
            email: email,
            id: { not: passwordReset.id },
            used_at: null,
          },
          data: { used_at: new Date() },
        }),
      ]);

      this.logger.log(`Password reset successful for user: ${user.id}`);

      // Send confirmation email
      await this.mailService.sendPasswordResetConfirmationEmail(email);

      return { message: 'Password reset successful' };
    } catch (error) {
      this.logger.error(`Reset password error: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to reset password');
    }
  }

  async changePassword(userId: number, changeDto: ChangePasswordDto) {
    try {
      const { currentPassword, newPassword } = changeDto;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new BadRequestException(
          'New password must be at least 8 characters long',
        );
      }

      if (currentPassword === newPassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Password changed for user: ${userId}`);

      // Send notification email
      await this.mailService.sendPasswordChangeNotificationEmail(user.email);

      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error(`Change password error: ${error.message}`, error.stack);
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Unable to change password');
    }
  }

  async verifyEmail(verifyDto: VerifyEmailDto) {
    try {
      const { token, email } = verifyDto;
      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new BadRequestException('Invalid verification link');
      }

      if (user.email_verified) {
        return { message: 'Email already verified' };
      }

      // Find valid verification token
      const emailVerification = await this.prisma.emailVerification.findFirst({
        where: {
          email: normalizedEmail,
          expires_at: {
            gt: new Date(),
          },
          used_at: null,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!emailVerification) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Verify token
      const isValidToken = await bcrypt.compare(token, emailVerification.token);
      if (!isValidToken) {
        throw new BadRequestException('Invalid verification token');
      }

      // Update user and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            email_verified: true,
            email_verified_at: new Date(),
            is_active: true,
            updated_at: new Date(),
          },
        }),
        this.prisma.emailVerification.update({
          where: { id: emailVerification.id },
          data: { used_at: new Date() },
        }),
      ]);

      this.logger.log(`Email verified for user: ${user.id}`);

      // Send welcome email
      await this.mailService.sendWelcomeEmail(
        normalizedEmail,
        user.first_name || 'User',
      );

      return { message: 'Email verified successfully' };
    } catch (error) {
      this.logger.error(`Verify email error: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to verify email');
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // Don't reveal if user exists
        return {
          message:
            'If the email is registered, a verification email has been sent',
        };
      }

      if (user.email_verified) {
        throw new BadRequestException('Email is already verified');
      }

      await this.sendVerificationEmail(normalizedEmail);

      return { message: 'Verification email sent' };
    } catch (error) {
      this.logger.error(
        `Resend verification error: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to send verification email');
    }
  }

  private async sendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const recentAttempts = await this.prisma.emailVerification.count({
      where: {
        email: normalizedEmail,
        created_at: {
          gte: new Date(Date.now() - this.RATE_LIMIT_WINDOW),
        },
      },
    });

    if (recentAttempts >= this.MAX_RESET_ATTEMPTS) {
      throw new BadRequestException(
        'Too many verification attempts. Please try again later.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verificationToken, 12);
    const expiresAt = new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRY);

    // Store verification token
    await this.prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        expires_at: expiresAt,
        user_id: user.id,
        created_at: new Date(),
      },
    });

    // Send verification email
    const verificationUrl = `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await this.mailService.sendEmailVerificationEmail(
      normalizedEmail,
      hashedToken,
    );

    this.logger.log(`Verification email sent to: ${normalizedEmail}`);
  }

  async getProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role_mappings: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Account is inactive');
      }

      return await this.formatUserResponse(user);
    } catch (error) {
      this.logger.error(`Get profile error: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Unable to fetch profile');
    }
  }

  // Cleanup expired tokens (run this periodically via cron job)
  async cleanupExpiredTokens() {
    try {
      const now = new Date();

      const result = await this.prisma.$transaction([
        this.prisma.passwordReset.deleteMany({
          where: {
            OR: [{ expires_at: { lt: now } }, { used_at: { not: null } }],
          },
        }),
        this.prisma.emailVerification.deleteMany({
          where: {
            OR: [{ expires_at: { lt: now } }, { used_at: { not: null } }],
          },
        }),
      ]);

      this.logger.log(
        `Expired tokens cleaned up: ${result[0].count + result[1].count} tokens removed`,
      );
      return {
        message: 'Token cleanup completed',
        deletedCount: result[0].count + result[1].count,
      };
    } catch (error) {
      this.logger.error(`Token cleanup error: ${error.message}`, error.stack);
      throw new BadRequestException('Token cleanup failed');
    }
  }
}
