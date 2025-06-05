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
  async getCart(@Req() req: RequestWithUser) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  async addToCart(
    @Req() req: RequestWithUser,
    @Body() data: { resourceId: number; quantity: number },
  ) {
    return this.cartService.addToCart(
      req.user.id,
      data.resourceId,
      data.quantity,
    );
  }

  @Delete(':id')
  async removeFromCart(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user.id, parseInt(id));
  }

  @Post('clear')
  async clearCart(@Req() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.id);
  }
}
