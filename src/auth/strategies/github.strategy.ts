import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const clientId = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

    // Debug logging
    console.log('GitHub OAuth Config:', {
      clientId: clientId ? 'SET' : 'MISSING',
      clientSecret: clientSecret ? 'SET' : 'MISSING',
      callbackURL: callbackURL ? 'SET' : 'MISSING',
    });

    if (!clientId || !clientSecret || !callbackURL) {
      throw new Error(
        `GitHub OAuth configuration is incomplete. Missing: ${[
          !clientId && 'GITHUB_CLIENT_ID',
          !clientSecret && 'GITHUB_CLIENT_SECRET',
          !callbackURL && 'GITHUB_CALLBACK_URL',
        ]
          .filter(Boolean)
          .join(', ')}`,
      );
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const { username, photos, emails } = profile;

      // Validate required fields
      if (!emails?.[0]?.value) {
        return done(new Error('Email not provided by GitHub'), null);
      }

      const user = {
        email: emails[0].value,
        username: username,
        picture: photos?.[0]?.value,
        accessToken,
      };

      // Find or create user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          profile_image_url: user.picture,
          auth_provider: 'GITHUB',
        },
      });

      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
}
