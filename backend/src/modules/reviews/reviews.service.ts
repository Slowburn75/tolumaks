import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, aggregates] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true, isHidden: false },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { productId, isApproved: true, isHidden: false } }),
      this.prisma.review.aggregate({
        where: { productId, isApproved: true, isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: Math.round((aggregates._avg.rating || 0) * 10) / 10,
        totalReviews: aggregates._count.rating,
      },
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          userId,
          status: { in: ['DELIVERED', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
          paymentStatus: 'PAID',
        },
      },
    });

    if (!purchased) {
      throw new BadRequestException('You can only review products you have purchased');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { userId, productId: dto.productId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        image: dto.image,
        userId,
        productId: dto.productId,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('You can only edit your own reviews');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: dto,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('You can only delete your own reviews');

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted successfully' };
  }

  async adminFindAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);

    return {
      data: reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminDelete(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted successfully' };
  }

  async approve(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async hide(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: true },
    });
  }
}
