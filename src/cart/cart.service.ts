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
  course_id: number | null;
  resource_id: number | null;
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
    console.log('AddToCartDto:', dto); // Debug log
    await this.validateItem(dto.type, dto.itemId);

    // Determine which foreign key to set based on item type
    let course_id: number | null = null;
    let resource_id: number | null = null;
    // let certification_id: number | null = null; // Uncomment if you have this column

    if (dto.type === CartItemType.COURSE) {
      course_id = dto.itemId;
    } else {
      resource_id = dto.itemId;
    }

    // Defensive check
    if (!course_id && !resource_id) {
      throw new BadRequestException(
        'Either course_id or resource_id must be set',
      );
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        user_id: userId,
        course_id,
        resource_id,
        // certification_id, // Uncomment if you have this column
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    }

    // Log what will be sent to the database
    console.log('Creating cart item with:', {
      user_id: userId,
      course_id,
      resource_id,
    });

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        user_id: userId,
        course_id,
        resource_id,
        // certification_id, // Uncomment if you have this column
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
    console.log(userId);
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

    // Only process valid items (must have course_id or resource_id)
    const cartWithDetails = await Promise.all(
      cartItems
        .filter((item) => item.course_id || item.resource_id)
        .map(async (item) => {
          const itemType = item.course_id
            ? CartItemType.COURSE
            : CartItemType.RESOURCE;
          const itemId = item.course_id ?? item.resource_id!;
          const itemDetails = await this.getItemDetails(itemType, itemId);
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

    // Prevent duplicate purchases for resources
    for (const item of cart.items) {
      if (item.resource_id) {
        const alreadyPurchased = await this.prisma.resourcePurchase.findFirst({
          where: {
            resource_id: item.resource_id,
            user_id: userId,
            status: 'COMPLETED',
          },
        });
        if (alreadyPurchased) {
          throw new BadRequestException(
            'You have already purchased one or more resources in your cart.',
          );
        }
      }
    }

    // Create order in your DB as before
    const order = await this.prisma.order.create({
      data: {
        user_id: userId,
        total: cart.total,
        status: 'PENDING',
      },
    });

    // Create Stripe Checkout Session
    const session = await this.stripeService.createCheckoutSession({
      payment_method_types: ['card'],
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.itemDetails.title,
          },
          unit_amount: Math.round(item.itemDetails.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url:
        'https://livetestdomain.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:
        'https://livetestdomain.com/cancel-payment?session_id={CHECKOUT_SESSION_ID}',
      metadata: {
        orderId: order.id.toString(),
        userId: userId.toString(),
      },
    });

    // Store the Stripe session ID in the order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripe_session_id: session.id },
    });

    // Return the payment URL
    return {
      order,
      checkoutUrl: session.url,
    };
  }

  // Confirm payment by Stripe session ID
  async confirmPayment(sessionId: string) {
    // Find the order by stripeSessionId
    const order = await this.prisma.order.findFirst({
      where: { stripe_session_id: sessionId },
    });
    if (!order) {
      throw new NotFoundException('Order not found for this session');
    }
    // Verify payment status with Stripe
    const session = await this.stripeService.getCheckoutSession(sessionId);
    const paymentStatus = session.payment_status;
    // If paid, update order status and clear cart
    if (paymentStatus === 'paid' && order.status !== 'COMPLETED') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });
      // Clear the user's cart
      await this.clearCart(order.user_id);
    }
    return { order, paymentStatus };
  }

  async getUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        orderItems: {
          include: {
            course: true,
            resource: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  private async validateItem(itemType: CartItemType, itemId: number) {
    switch (itemType) {
      case CartItemType.COURSE: {
        const course = await this.prisma.course.findUnique({
          where: { id: itemId },
        });
        if (!course) {
          throw new NotFoundException('Course not found');
        }
        return course;
      }
      case CartItemType.CERTIFICATION: {
        const certification = await this.prisma.userCertification.findUnique({
          where: { id: itemId },
        });
        if (!certification) {
          throw new NotFoundException('Certification not found');
        }
        return certification;
      }
      case CartItemType.RESOURCE:
      default: {
        const foundResource = await this.prisma.resource.findUnique({
          where: { id: itemId },
        });
        if (!foundResource) {
          throw new NotFoundException('Resource not found');
        }
        return foundResource;
      }
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
