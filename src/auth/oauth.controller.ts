import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class OAuthController {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This route initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const token = this.jwtService.sign({
      sub: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    // Redirect to frontend with token
    res.redirect(
      `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${token}`,
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // This route initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    const token = this.jwtService.sign({
      sub: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    // Redirect to frontend with token
    res.redirect(
      `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${token}`,
    );
  }
}
