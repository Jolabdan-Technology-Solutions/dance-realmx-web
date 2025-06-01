import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface GoogleProfile {
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/auth/google/callback',
    );

    // Debug logging
    console.log('Google OAuth Config:', {
      clientID: clientID ? 'SET' : 'MISSING',
      clientSecret: clientSecret ? 'SET' : 'MISSING',
      callbackURL: callbackURL ? 'SET' : 'MISSING',
    });

    if (!clientID || !clientSecret) {
      throw new Error(
        `Google OAuth configuration is incomplete. Missing: ${[
          !clientID && 'GOOGLE_CLIENT_ID',
          !clientSecret && 'GOOGLE_CLIENT_SECRET',
        ]
          .filter(Boolean)
          .join(', ')}`,
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;

      // Validate required fields
      if (!emails?.[0]?.value) {
        return done(new Error('Email not provided by Google'), '');
      }

      const user = {
        email: emails[0].value,
        firstName: name?.givenName,
        lastName: name?.familyName,
        picture: photos?.[0]?.value,
        accessToken,
      };

      // Find or create user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // Optionally update existing user data
        const updatedUser = await this.prisma.user.update({
          where: { email: user.email },
          data: {
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.picture,
          },
        });
        return done(null, updatedUser);
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: user.email,
          username: user.email.split('@')[0], // Generate username from email
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.picture,
          auth_provider: 'GOOGLE',
        },
      });

      return done(null, newUser);
    } catch (error) {
      return done(error, '');
    }
  }
}
