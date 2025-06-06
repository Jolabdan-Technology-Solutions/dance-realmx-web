import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ResourceOwnerGuard } from './guards/resource-owner.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { CoursesService } from '../courses/courses.service';
import { BookingsService } from '../bookings/bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsModule } from '../permissions/permissions.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionTierGuard } from './guards/subscription-tier.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    ConfigModule,
    PermissionsModule,
    StripeModule,
    SubscriptionsModule,
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    ResourceOwnerGuard,
    SubscriptionGuard,
    CoursesService,
    BookingsService,
    PrismaService,
    JwtStrategy,
    SubscriptionTierGuard,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    ResourceOwnerGuard,
    SubscriptionGuard,
    AuthService,
    SubscriptionTierGuard,
  ],
})
export class AuthModule {}
