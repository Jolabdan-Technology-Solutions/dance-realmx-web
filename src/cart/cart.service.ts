import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, CartItemType } from './dto/add-to-cart.dto';
import { StripeService } from '../stripe/stripe.service';

interface CartItem {
  id: number;
  user_id: number;
  course_id?: number;
  resource_id?: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async addToCart(userId: number, dto: AddToCartDto): Promise<CartItem> {
    await this.validateItem(dto.type, dto.itemId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        user_id: userId,
        course_id: dto.type === CartItemType.COURSE ? dto.itemId : null,
        resource_id: dto.type === CartItemType.SUBSCRIPTION ? dto.itemId : null,
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    }

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        user_id: userId,
        course_id: dto.type === CartItemType.COURSE ? dto.itemId : null,
        resource_id: dto.type === CartItemType.SUBSCRIPTION ? dto.itemId : null,
        quantity: 1,
      },
    });
  }

  async removeFromCart(userId: number, cartItemId: number): Promise<void> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, user_id: userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async clearCart(userId: number): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { user_id: userId },
    });
  }

  async updateCartItemQuantity(
    userId: number,
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, user_id: userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async getCart(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        course: true,
        resource: true,
      },
    });

    // Get item details for each cart item
    const cartWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const itemDetails = await this.getItemDetails(
          item.course_id ? CartItemType.COURSE : CartItemType.RESOURCE,
          item.course_id ?? item.resource_id ?? 0,
        );
        return {
          ...item,
          itemDetails,
        };
      }),
    );

    // Calculate total
    const total = cartWithDetails.reduce((sum, item) => {
      return sum + item.itemDetails.price * item.quantity;
    }, 0);

    return {
      items: cartWithDetails,
      total,
    };
  }

  async checkout(userId: number) {
    const cart = await this.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        user_id: userId,
        total: cart.total,
        status: 'PENDING',
        items: {
          create: cart.items.map((item) => ({
            course_id: item.course_id,
            resource_id: item.resource_id,
            quantity: item.quantity,
            price: item.itemDetails.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Create Stripe payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: Math.round(cart.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id.toString(),
        userId: userId.toString(),
      },
    });

    // Update order with payment intent
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAYMENT_PENDING',
      },
    });

    // Clear cart
    await this.clearCart(userId);

    return {
      order,
      clientSecret: paymentIntent.client_secret,
    };
  }

  private async validateItem(itemType: CartItemType, itemId: number) {
    switch (itemType) {
      case CartItemType.COURSE:
        const course = await this.prisma.course.findUnique({
          where: { id: itemId },
        });
        if (!course) {
          throw new NotFoundException('Course not found');
        }
        return course;

      case CartItemType.RESOURCE:
        const resource = await this.prisma.resource.findUnique({
          where: { id: itemId },
        });
        if (!resource) {
          throw new NotFoundException('Resource not found');
        }
        return resource;

      case CartItemType.CERTIFICATION:
        const certification = await this.prisma.userCertification.findUnique({
          where: { id: itemId },
        });
        if (!certification) {
          throw new NotFoundException('Certification not found');
        }
        return certification;

      default:
        throw new BadRequestException('Invalid item type');
    }
  }

  private async getItemDetails(itemType: CartItemType, itemId: number) {
    switch (itemType) {
      case CartItemType.COURSE:
        const course = await this.prisma.course.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            title: true,
            price: true,
            image_url: true,
          },
        });
        if (!course) {
          throw new NotFoundException(`Course with ID ${itemId} not found`);
        }
        return course;

      case CartItemType.RESOURCE:
        const resource = await this.prisma.resource.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            title: true,
            price: true,
            url: true,
          },
        });
        if (!resource) {
          throw new NotFoundException(`Resource with ID ${itemId} not found`);
        }
        return resource;

      case CartItemType.CERTIFICATION:
        const certification = await this.prisma.userCertification.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            course: {
              select: {
                title: true,
                price: true,
              },
            },
          },
        });
        if (!certification) {
          throw new NotFoundException(
            `Certification with ID ${itemId} not found`,
          );
        }
        return {
          id: certification.id,
          title: certification.course.title,
          price: certification.course.price,
        };

      default:
        throw new BadRequestException(`Invalid item type: ${itemType}`);
    }
  }
}
