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
import { Request as ExpressRequest } from 'express';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { RequireFeature } from '../auth/decorators/feature.decorator';
import { Feature } from '../auth/enums/feature.enum';

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
@UseGuards(JwtAuthGuard, FeatureGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @RequireFeature(Feature.USE_CART)
  addToCart(
    @Request() req: RequestWithUser,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItem> {
    if (!req.user?.id) throw new Error('User not found');
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Get()
  @RequireFeature(Feature.USE_CART)
  getCart(
    @Request() req: RequestWithUser,
  ): Promise<{ items: CartItem[]; total: number }> {
    if (!req.user?.id) throw new Error('User not found');
    return this.cartService.getCart(req.user.id);
  }

  @Delete(':id')
  @RequireFeature(Feature.USE_CART)
  removeFromCart(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.removeFromCart(+req.user.sub, +id);
  }

  @Delete()
  @RequireFeature(Feature.USE_CART)
  clearCart(@Request() req: RequestWithUser): Promise<void> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.clearCart(+req.user.sub);
  }

  @Patch(':id/quantity')
  @RequireFeature(Feature.USE_CART)
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
  @RequireFeature(Feature.MAKE_PAYMENTS)
  checkout(
    @Request() req: RequestWithUser,
  ): Promise<{ order: any; clientSecret: string | null }> {
    if (!req.user?.sub) throw new Error('User not found');
    return this.cartService.checkout(+req.user.sub);
  }
}
