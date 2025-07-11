import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: number | string; email: string }) {
    console.log('JWT payload:', payload);
    console.log(
      'User ID from token:',
      payload.sub,
      'Type:',
      typeof payload.sub,
    );

    // Convert sub to number if it's a string
    const userId =
      typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;

    if (!userId || isNaN(userId)) {
      console.error('Invalid user ID in JWT payload:', payload.sub);
      return null;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      console.log('Found user:', user ? user.id : 'null');

      if (!user) {
        console.error('User not found in database for ID:', userId);
        return null;
      }

      // Exclude sensitive fields like password and add sub field
      const { password, ...safeUser } = user;
      return {
        ...safeUser,
        sub: userId, // Add the sub field for compatibility
      };
    } catch (error) {
      console.error('Database error in JWT validation:', error);
      return null;
    }
  }
}
