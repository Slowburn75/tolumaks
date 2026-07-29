import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateTrackingDto } from './orders.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { calculateShippingFee } from './shipping';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private generateOrderNumber(): string {
    const prefix = 'TOL';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const paymentMethod = (dto.paymentMethod || 'bank_transfer').toLowerCase();
    if (paymentMethod !== 'bank_transfer') {
      throw new BadRequestException('Only bank transfer is available at this time. Card payments coming soon.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        name: string;
        price: Prisma.Decimal;
        quantity: number;
        size?: string;
        color?: string;
        image: string | null;
      }> = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            images: { take: 1, orderBy: { order: 'asc' } },
            variants: true,
          },
        });
        if (!product || product.status !== 'ACTIVE') {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        const variant =
          product.variants?.length && (item.size || item.color)
            ? product.variants.find(
                (v) =>
                  (!item.size || (v.size || '').toLowerCase() === item.size.toLowerCase()) &&
                  (!item.color || (v.color || '').toLowerCase() === item.color.toLowerCase()),
              )
            : null;

        if (product.variants?.length && (item.size || item.color) && !variant) {
          throw new BadRequestException(`Selected size/color unavailable for ${product.name}`);
        }

        if (variant) {
          const vUpdated = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (vUpdated.count === 0) {
            throw new BadRequestException(`Insufficient stock for ${product.name}`);
          }
          // keep product aggregate in sync
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          const updated = await tx.product.updateMany({
            where: { id: product.id, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new BadRequestException(`Insufficient stock for ${product.name}`);
          }
        }

        const unitPrice = variant?.price ?? product.discountPrice ?? product.price;
        subtotal += Number(unitPrice) * item.quantity;

        orderItemsData.push({
          productId: product.id,
          name: product.name,
          price: unitPrice,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: product.images?.[0]?.url || null,
        });
      }

      let discount = 0;
      let couponId: string | null = null;
      let couponCode: string | null = dto.couponCode || null;

      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } });
        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Invalid coupon code');
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new BadRequestException('Coupon has expired');
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new BadRequestException('Coupon usage limit reached');
        }
        if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
          throw new BadRequestException(`Minimum order amount of ${coupon.minOrderAmount} required`);
        }

        const maxPerUser = coupon.maxPerUser ?? 1;
        if (maxPerUser > 0) {
          const userUses = await tx.couponUsage.count({
            where: { couponId: coupon.id, userId },
          });
          if (userUses >= maxPerUser) {
            throw new BadRequestException('You have already used this coupon the maximum number of times');
          }
        }

        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
        } else {
          discount = Number(coupon.discountValue);
        }
        discount = Math.min(discount, subtotal);
        couponId = coupon.id;
        couponCode = coupon.code;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const shippingFee = calculateShippingFee(dto.deliveryMethod, subtotal);
      const total = Math.max(0, subtotal - discount + shippingFee);
      const orderNumber = this.generateOrderNumber();

      const shippingAddress = dto.shippingAddress;
      const billingAddress = dto.billingAddress || dto.shippingAddress;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal,
          shippingFee,
          discount,
          total,
          couponCode,
          shippingAddress: shippingAddress as object,
          billingAddress: billingAddress as object,
          deliveryMethod: dto.deliveryMethod || 'standard',
          notes: dto.notes,
          couponId,
          items: { create: orderItemsData },
          payment: {
            create: {
              provider: 'bank_transfer',
              reference: orderNumber,
              status: 'pending',
              amount: total,
              currency: 'NGN',
              metadata: {
                paymentMethod: 'bank_transfer',
                instructions: 'Transfer the exact total and use the order number as reference.',
              },
            },
          },
        },
        include: {
          items: true,
          payment: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: created.id },
        });
      }

      for (const item of dto.items) {
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            type: 'ORDER',
            note: `Order #${orderNumber} (awaiting bank transfer)`,
          },
        });
      }

      // Clear server cart after successful order
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return created;
    });

    try {
      await this.emailService.sendOrderConfirmationEmail(user.email, order.orderNumber);
    } catch {
      // non-fatal
    }

    return order;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          items: { include: { product: { select: { id: true, slug: true, images: { take: 1, orderBy: { order: 'asc' } } } } } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, userId?: string) {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, name: true, images: { take: 5, orderBy: { order: 'asc' } } } },
          },
        },
        payment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async track(orderNumber: string, email: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        user: { email },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        trackingNumber: true,
        courier: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAll(page = 1, limit = 20, status?: string, search?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (userId) where.userId = userId;
    if (status) where.status = status as OrderStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          payment: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin confirms bank transfer received → mark order + payment as PAID.
   */
  async confirmBankPayment(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payment: true, user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order payment is already confirmed');
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot confirm payment on a cancelled order');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: 'PAID' as PaymentStatus,
          status: 'PAID' as OrderStatus,
          paidAt: new Date(),
        },
        include: {
          items: true,
          payment: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: 'success' },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: id,
            provider: 'bank_transfer',
            reference: order.orderNumber,
            status: 'success',
            amount: order.total,
            currency: 'NGN',
          },
        });
      }

      return next;
    });

    try {
      await this.emailService.sendOrderStatusUpdateEmail(order.user.email, order.orderNumber, 'PAID');
    } catch {
      // non-fatal
    }

    return updated;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const validStatuses = [
      'PENDING', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
    ];

    const status = dto.status.toUpperCase();

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid order status');
    }

    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      throw new BadRequestException(`Cannot update status of ${order.status.toLowerCase()} order`);
    }

    // Cancelling via admin status dropdown should restore stock
    if (status === 'CANCELLED') {
      return this.cancelOrderInternal(order.id, order);
    }

    const updateData: Prisma.OrderUpdateInput = { status: status as OrderStatus };

    if (status === 'PAID') {
      updateData.paidAt = new Date();
      updateData.paymentStatus = 'PAID' as PaymentStatus;
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    if (status === 'REFUNDED') {
      updateData.paymentStatus = 'REFUNDED' as PaymentStatus;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id },
        data: updateData,
        include: { items: true, payment: true, user: { select: { email: true } } },
      });

      if (status === 'PAID' && order.paymentStatus !== 'PAID') {
        await tx.payment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            provider: 'bank_transfer',
            reference: order.orderNumber,
            status: 'success',
            amount: order.total,
            currency: 'NGN',
          },
          update: { status: 'success' },
        });
      }

      return next;
    });

    try {
      await this.emailService.sendOrderStatusUpdateEmail(updated.user.email, updated.orderNumber, status);
    } catch {
      // non-fatal
    }

    return updated;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Customers may only cancel unpaid pending bank-transfer orders
    if (order.status !== 'PENDING' || order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order cannot be cancelled at this stage. Contact support if you need help.');
    }

    return this.cancelOrderInternal(orderId, order);
  }

  private async cancelOrderInternal(
    orderId: string,
    order: {
      orderNumber: string;
      couponId: string | null;
      items: Array<{ productId: string; quantity: number; size?: string | null; color?: string | null }>;
    },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        if (item.size || item.color) {
          const variants = await tx.productVariant.findMany({ where: { productId: item.productId } });
          const variant = variants.find(
            (v) =>
              (!item.size || (v.size || '').toLowerCase() === (item.size || '').toLowerCase()) &&
              (!item.color || (v.color || '').toLowerCase() === (item.color || '').toLowerCase()),
          );
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: item.quantity,
            type: 'CANCEL',
            note: `Order #${order.orderNumber} cancelled — stock restored`,
          },
        });
      }

      if (order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
        await tx.couponUsage.deleteMany({ where: { orderId } });
      }

      await tx.payment.updateMany({
        where: { orderId, status: 'pending' },
        data: { status: 'cancelled' },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' as OrderStatus },
        include: { items: true, payment: true },
      });
    });

    return updated;
  }

  async updateTracking(id: string, dto: UpdateTrackingDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id },
      data: { trackingNumber: dto.trackingNumber, courier: dto.courier },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });
  }
}
