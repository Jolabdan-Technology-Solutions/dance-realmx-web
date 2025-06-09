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

interface CartItem {
  id: number;
  user_id: number;
  course_id?: number;
  resource_id?: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItem> {
    return this.cartService.addToCart(req?.user?.id, addToCartDto);
  }

  @Get()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  getCart(@Request() req): Promise<{ items: CartItem[]; total: number }> {
    console.log(req.user);
    return this.cartService.getCart(req?.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  removeFromCart(@Request() req, @Param('id') id: string): Promise<void> {
    return this.cartService.removeFromCart(req?.user?.sub, +id);
  }

  @Delete()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  clearCart(@Request() req): Promise<void> {
    return this.cartService.clearCart(req?.user?.sub);
  }

  @Patch(':id/quantity')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  updateQuantity(
    @Request() req,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<CartItem> {
    return this.cartService.updateCartItemQuantity(
      req?.user?.sub,
      +id,
      quantity,
    );
  }

  @Post('checkout')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  checkout(
    @Request() req,
  ): Promise<{ order: any; clientSecret: string | null }> {
    return this.cartService.checkout(req?.user?.sub);
  }
}
