import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
<<<<<<< HEAD
  Request,
  HttpCode,
  HttpStatus,
=======
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  GoneException,
>>>>>>> dev-backend
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
<<<<<<< HEAD
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('/api/')
export class AuthController {
  constructor(private authService: AuthService) {}
=======
  ApiBody,
} from '@nestjs/swagger';
import { EmailDto } from './dto/email.dto';
import { ResetPasswordDto } from './dto/password.dto';
import { ChangePasswordDto } from './dto/password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Request } from 'express';
import { RequestWithUser } from './interfaces/request.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import {
  UserAnalyticsResponseDto,
  InstructorAnalyticsResponseDto,
} from './dto/analytics.dto';

@ApiTags('Authentication')
@Controller('')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}
>>>>>>> dev-backend

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
<<<<<<< HEAD
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
=======
    return this.authService.login(loginDto);
>>>>>>> dev-backend
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
<<<<<<< HEAD
  async register(@Body() registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.authService.validateUser(
      req.user.email,
      req.user.password,
    );
    return user;
=======
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req) {
    return this.authService.logout(req?.user?.id);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 409, description: 'Token expired' })
  @ApiResponse({ status: 410, description: 'Invalid refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      // Verify the refresh token to get the user ID
      const decoded = this.jwtService.verify(refreshTokenDto.refresh_token);
      if (!decoded.sub) {
        throw new GoneException('Invalid refresh token');
      }
      return this.authService.refreshToken(
        decoded.sub,
        refreshTokenDto.refresh_token,
      );
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ConflictException('Token has expired');
      }
      throw new GoneException('Invalid refresh token');
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() emailDto: EmailDto) {
    return this.authService.forgotPassword(emailDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changeDto: ChangePasswordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.authService.changePassword(req.user.id, changeDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email resent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async resendVerificationEmail(@Body() emailDto: EmailDto) {
    return this.authService.resendVerificationEmail(emailDto.email);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    console.log(req.user);
    return this.authService.getProfile(req.user.id);
  }

  @Get('analytics/users')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns user statistics including total users, role distribution, and revenue metrics',
    type: UserAnalyticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAnalytics(): Promise<UserAnalyticsResponseDto> {
    return this.authService.getUserAnalytics();
  }

  @Get('analytics/instructors')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get instructor analytics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns instructor statistics including total instructors, performance metrics, and revenue',
    type: InstructorAnalyticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInstructorAnalytics(): Promise<InstructorAnalyticsResponseDto> {
    return this.authService.getInstructorAnalytics();
>>>>>>> dev-backend
  }
}
