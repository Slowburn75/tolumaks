import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestException('Coupon usage limit reached');
    if (dto.orderAmount && coupon.minOrderAmount && dto.orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount of ${coupon.minOrderAmount} required`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = ((dto.orderAmount || 0) * Number(coupon.discountValue)) / 100;
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);

    return { data: coupons, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        usageLimit: dto.usageLimit,
        maxPerUser: dto.maxPerUser ?? 1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (dto.code) {
      const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
      if (existing && existing.id !== id) throw new BadRequestException('Coupon code already exists');
    }

    const data: any = { ...dto };
    if (dto.code) data.code = dto.code.toUpperCase();
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    return this.prisma.coupon.update({ where: { id }, data });
  }

  async delete(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }
}
