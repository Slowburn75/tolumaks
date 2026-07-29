import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, recentUsers, lowStockProducts, ordersByStatus] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, items: { take: 3 } },
      }),
      this.prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, createdAt: true } }),
      this.prisma.product.findMany({ where: { stockQuantity: { lte: 10 }, status: 'ACTIVE' }, take: 10, select: { id: true, name: true, slug: true, stockQuantity: true } }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
    ]);

    const currentMonthRevenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID', paidAt: { gte: startOfMonth } },
    });

    const lastMonthRevenue = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
    });

    const currentMonthOrders = await this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } });
    const lastMonthOrders = await this.prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } });

    const currentMonthUsers = await this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } });
    const lastMonthUsers = await this.prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } });

    return {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        currentMonthRevenue: currentMonthRevenue._sum.total || 0,
        lastMonthRevenue: lastMonthRevenue._sum.total || 0,
        currentMonthOrders,
        lastMonthOrders,
        currentMonthUsers,
        lastMonthUsers,
      },
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count })),
      recentOrders,
      recentUsers,
      lowStockProducts,
    };
  }

  async getCustomers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { role: 'USER' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, phone: true, avatar: true,
          isBlocked: true, isEmailVerified: true, createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCustomer(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'USER' },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        isBlocked: true, isEmailVerified: true, createdAt: true, updatedAt: true,
        addresses: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) throw new NotFoundException('Customer not found');
    return user;
  }

  async getSettings() {
    const row = await this.prisma.storeSetting.findUnique({ where: { id: 'default' } });
    const { mergeSiteSettings } = await import('./site-settings.defaults');
    return mergeSiteSettings(row?.data);
  }

  async updateSettings(settings: Record<string, unknown>) {
    const { mergeSiteSettings } = await import('./site-settings.defaults');
    // Admin sends full settings document — merge with defaults so new keys stay safe
    const merged = mergeSiteSettings(settings);
    await this.prisma.storeSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', data: merged as object },
      update: { data: merged as object },
    });
    return merged;
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, paymentStatus: 'PAID' },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyRevenue: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + Number(order.total);
      dailyOrders[dateKey] = (dailyOrders[dateKey] || 0) + 1;
    });

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      summary: { totalRevenue, totalOrders, averageOrderValue },
      dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })),
      dailyOrders: Object.entries(dailyOrders).map(([date, count]) => ({ date, count })),
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        totalQuantity: p._sum.quantity || 0,
        totalRevenue: p._sum.price || 0,
      })),
    };
  }
}
