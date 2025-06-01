import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { CoursesService } from '../../courses/courses.service';
import { BookingsService } from '../../bookings/bookings.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const ResourceOwner = (resourceType: string) =>
  SetMetadata(RESOURCE_OWNER_KEY, resourceType);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private coursesService: CoursesService,
    private bookingsService: BookingsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.getAllAndOverride<string>(
      RESOURCE_OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resourceType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const resourceId = request.params.id;

    // Admins can access any resource
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Check if the user owns the resource
    switch (resourceType) {
      case 'course':
        return await this.checkCourseOwnership(user.id, resourceId);
      case 'booking':
        return await this.checkBookingOwnership(user.id, resourceId);
      case 'subscription':
        return await this.checkSubscriptionOwnership(user.id, resourceId);
      default:
        return false;
    }
  }

  private async checkCourseOwnership(
    userId: number,
    courseId: string,
  ): Promise<boolean> {
    const course = await this.coursesService.findOne(+courseId);
    return course?.instructor_id === userId;
  }

  private async checkBookingOwnership(
    userId: number,
    bookingId: string,
  ): Promise<boolean> {
    const booking = await this.bookingsService.findOne(+bookingId);
    return booking?.user_id === userId;
  }

  private async checkSubscriptionOwnership(
    userId: number,
    subscriptionId: string,
  ): Promise<boolean> {
    const subscription =
      await this.subscriptionsService.findById(+subscriptionId);
    return subscription?.user_id === userId;
  }
}
