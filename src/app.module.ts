import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InstructorModule } from './instructor/instructor.module';
import { CoursesModule } from './courses/courses.module';
import { BookingsModule } from './bookings/bookings.module';
import { ResourcesModule } from './resources/resources.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TenantsModule } from './tenants/tenants.module';
import { FeaturesModule } from './features/features.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CartModule } from './cart/cart.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EventsModule } from './events/events.module';
import { CertificatesModule } from './certificates/certificates.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),
    PrismaModule,
    CoursesModule,
    BookingsModule,
    ResourcesModule,
    SubscriptionsModule,
    ReviewsModule,
    PaymentsModule,
    CategoriesModule,
    TagsModule,
    InstructorModule,
    NotificationsModule,
    AuthModule,
    MessagesModule,
    CloudinaryModule,
    ProfilesModule,
    PermissionsModule,
    TenantsModule,
    FeaturesModule,
    CartModule,
    EnrollmentsModule,
    EventsModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
