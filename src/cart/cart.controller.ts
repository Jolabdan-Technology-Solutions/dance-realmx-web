import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// Make sure cart.service.ts exists in the same directory, or update the path if it's elsewhere
import { CartService } from './cart.service';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Body('userId') userId: number) {
    return this.cartService.getCart(userId);
  }

  @Post('add')
  async addToCart(
    @Body('userId') userId: number,
    @Body('itemId') itemId: number,
    @Body('itemType') itemType: string,
    @Body('quantity') quantity: string,
  ) {
    return this.cartService.addToCart(userId, itemId, itemType);
  }

  @Delete(':itemId')
  async removeFromCart(
    @Body('userId') userId: number,
    @Param('itemId') itemId: number,
  ) {
    return this.cartService.removeFromCart(userId, itemId);
  }

  @Delete()
  async clearCart(@Body('userId') userId: number) {
    return this.cartService.clearCart(userId);
  }
}
