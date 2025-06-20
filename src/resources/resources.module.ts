import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailModule } from '@/mail/mail.module';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [
    CloudinaryModule,
    PrismaModule,
    SubscriptionsModule,
    MailModule,
    PermissionsModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
