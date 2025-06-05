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

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Get()
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  removeFromCart(@Request() req, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user.id, +id);
  }

  @Patch(':id/quantity')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  updateQuantity(
    @Request() req,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateCartItemQuantity(req.user.id, +id, quantity);
  }

  @Post('checkout')
  @Roles(UserRole.STUDENT, UserRole.BOOKING_USER)
  checkout(@Request() req) {
    return this.cartService.checkout(req.user.id);
  }
}
