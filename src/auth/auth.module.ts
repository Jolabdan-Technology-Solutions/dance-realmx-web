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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
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
  ],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    ResourceOwnerGuard,
    SubscriptionGuard,
    CoursesService,
    BookingsService,
    SubscriptionsService,
    PrismaService,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    ResourceOwnerGuard,
    SubscriptionGuard,
    AuthService,
  ],
})
export class AuthModule {}
