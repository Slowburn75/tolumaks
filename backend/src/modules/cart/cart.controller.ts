import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:id')
  async updateItem(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(userId, id, dto);
  }

  @Delete('items/:id')
  async removeItem(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.cartService.removeItem(userId, id);
  }

  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('merge')
  async mergeCart(
    @CurrentUser('id') userId: string,
    @Body() body: { items?: Array<{ productId: string; quantity: number; size?: string; color?: string }> },
  ) {
    return this.cartService.mergeCart(userId, body.items || []);
  }
}
