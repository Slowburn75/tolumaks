import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private availableStock(
    product: { stockQuantity: number; variants: Array<{ size: string | null; color: string | null; stock: number }> },
    size?: string,
    color?: string,
  ): number {
    if (product.variants?.length) {
      const match = product.variants.find(
        (v) =>
          (!size || (v.size || '').toLowerCase() === size.toLowerCase()) &&
          (!color || (v.color || '').toLowerCase() === color.toLowerCase()),
      );
      if (size || color) {
        if (!match) return 0;
        return match.stock;
      }
      // no size/color selected — use product total or sum of variants
      const sum = product.variants.reduce((s, v) => s + v.stock, 0);
      return sum > 0 ? sum : product.stockQuantity;
    }
    return product.stockQuantity;
  }

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: 'asc' }, take: 1 },
                variants: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { order: 'asc' }, take: 1 },
                  variants: true,
                },
              },
            },
          },
        },
      });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, subtotal, itemCount };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found');
    }

    const stock = this.availableStock(product, dto.size, dto.color);
    if (dto.quantity > stock) {
      throw new BadRequestException(`Only ${stock} items available in stock`);
    }

    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        size: dto.size || null,
        color: dto.color || null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (newQuantity > stock) {
        throw new BadRequestException(`Only ${stock} items available in stock`);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          size: dto.size,
          color: dto.color,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { include: { variants: true } } },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return this.getCart(userId);
    }

    const stock = this.availableStock(item.product, item.size || undefined, item.color || undefined);
    if (dto.quantity > stock) {
      throw new BadRequestException(`Only ${stock} items available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared successfully' };
  }

  /** Merge guest/local cart lines into the user's server cart after login */
  async mergeCart(
    userId: string,
    items: Array<{ productId: string; quantity: number; size?: string; color?: string }>,
  ) {
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) continue;
      try {
        await this.addItem(userId, {
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        });
      } catch {
        // skip invalid/out-of-stock lines
      }
    }
    return this.getCart(userId);
  }
}
