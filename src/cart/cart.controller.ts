import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

interface CartItem {
  id: number;
  user_id: number;
  course_id?: number;
  resource_id?: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

interface RequestWithUser extends ExpressRequest {
  user?: {
    id: number;
    sub: string;
  };
}

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles(
    UserRole.STUDENT,
    UserRole.BOOKING_USER,
    UserRole.ADMIN,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.INSTRUCTOR,
  )
  addToCart(
    @Request() req: RequestWithUser,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItem> {
    if (!req.user?.id) throw new Error('User not found');
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Get()
  @Roles(
    UserRole.STUDENT,
    UserRole.BOOKING_USER,
    UserRole.ADMIN,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.INSTRUCTOR,
    UserRole.CURRICULUM_SELLER,
    UserRole.BOOKING_PROFESSIONAL,
    UserRole.COURSE_CREATOR_ADMIN,
    UserRole.CURRICULUM_ADMIN,
    UserRole.DIRECTORY_MEMBER,
    UserRole.CERTIFICATION_MANAGER,
  )
  getCart(
    @Request() req: RequestWithUser,
  ): Promise<{ items: CartItem[]; total: number }> {
    if (!req.user?.id) throw new Error('User not found');
    return this.cartService.getCart(req.user.id);
  }

  @Delete(':id')
  @Roles(
    UserRole.STUDENT,
    UserRole.BOOKING_USER,
    UserRole.ADMIN,
    UserRole.INSTRUCTOR_ADMIN,
    UserRole.INSTRUCTOR,
  )
  removeFromCart(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.removeFromCart(+req.user.sub, +id);
  }

  @Delete()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  clearCart(@Request() req: RequestWithUser): Promise<void> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.clearCart(+req.user.sub);
  }

  @Patch(':id/quantity')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  updateQuantity(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<CartItem> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.updateCartItemQuantity(
      +req.user.sub,
      +id,
      quantity,
    );
  }

  @Post('checkout')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  checkout(
    @Request() req: RequestWithUser,
  ): Promise<{ order: any; clientSecret: string | null }> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.checkout(+req.user.sub);
  }
}
