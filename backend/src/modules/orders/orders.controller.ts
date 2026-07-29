import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateTrackingDto, TrackOrderDto } from './orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Post('orders/track')
  async track(@Body() dto: TrackOrderDto) {
    return this.ordersService.track(dto.orderNumber, dto.email);
  }

  @Get('orders/me')
  @UseGuards(JwtAuthGuard)
  async findMyOrders(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    return this.ordersService.findByUser(userId, query.page, query.limit);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.findById(id, userId);
  }

  @Post('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.cancelOrder(userId, id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  /** Confirm bank transfer received (sets payment + order to PAID) */
  @Post('admin/orders/:id/confirm-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async confirmBankPayment(@Param('id') id: string) {
    return this.ordersService.confirmBankPayment(id);
  }

  @Patch('admin/orders/:id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateTracking(@Param('id') id: string, @Body() dto: UpdateTrackingDto) {
    return this.ordersService.updateTracking(id, dto);
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminFindById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(@Query() query: PaginationDto & { status?: string; userId?: string }) {
    return this.ordersService.findAll(query.page, query.limit, query.status, query.search, query.userId);
  }
}
