import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './products.dto';
import { v2 as cloudinary } from 'cloudinary';
import * as slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async findAll(filter: ProductFilterDto) {
    const {
      search, categorySlug, brandSlug, gender, ageGroup, minPrice, maxPrice,
      colors, sizes, sortBy, sort, sortOrder, page, limit, isSale, isNewArrival, isBestSeller, isFeatured,
    } = filter as typeof filter & {
      sort?: string;
      isSale?: boolean | string;
      isNewArrival?: boolean | string;
      isBestSeller?: boolean | string;
      isFeatured?: boolean | string;
    };
    const skip = ((page || 1) - 1) * (limit || 20);
    const where: any = { status: 'ACTIVE' };

    const truthy = (v: unknown) => v === true || v === 'true' || v === '1';
    if (truthy(isSale)) where.isSale = true;
    if (truthy(isNewArrival)) where.isNewArrival = true;
    if (truthy(isBestSeller)) where.isBestSeller = true;
    if (truthy(isFeatured)) where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (categorySlug) {
      where.categories = { some: { category: { slug: categorySlug } } };
    }

    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    if (gender) where.gender = gender;
    if (ageGroup) where.ageGroup = ageGroup;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (colors) {
      const colorArray = colors.split(',');
      where.variants = { some: { color: { in: colorArray, mode: 'insensitive' } } };
    }

    if (sizes) {
      const sizeArray = sizes.split(',');
      if (!where.variants) where.variants = {};
      where.variants = { ...where.variants, some: { ...(where.variants.some || {}), size: { in: sizeArray, mode: 'insensitive' } } };
    }

    // Accept both sortBy=price + sortOrder, and convenience values like price_asc / latest
    let orderBy: any = { createdAt: 'desc' };
    const sortKey = String(sortBy || sort || '').toLowerCase();
    if (sortKey === 'price' || sortKey === 'price_asc') orderBy = { price: sortOrder || 'asc' };
    else if (sortKey === 'price_desc') orderBy = { price: 'desc' };
    else if (sortKey === 'newest' || sortKey === 'latest') orderBy = { createdAt: 'desc' };
    else if (sortKey === 'name') orderBy = { name: sortOrder || 'asc' };
    else if (sortKey === 'rating' || sortKey === 'highest_rated') orderBy = { reviews: { _count: 'desc' } };
    else if (sortKey === 'best_sellers') orderBy = { isBestSeller: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { ...where, status: 'ACTIVE' },
        skip,
        take: limit || 20,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' } },
          variants: true,
          categories: { include: { category: true } },
          brand: true,
          reviews: { where: { isApproved: true }, select: { rating: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
      }),
      this.prisma.product.count({ where: { ...where, status: 'ACTIVE' } }),
    ]);

    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const { reviews, ...rest } = product;
      return { ...rest, averageRating: Math.round(avgRating * 10) / 10, reviewCount: ratings.length };
    });

    return {
      data: productsWithRating,
      meta: { page: page || 1, limit: limit || 20, total, totalPages: Math.ceil(total / (limit || 20)) },
    };
  }

  async adminFindAll(filter: ProductFilterDto) {
    const { search, page, limit, sortBy, sortOrder } = filter;
    const skip = ((page || 1) - 1) * (limit || 20);
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name') orderBy = { name: sortOrder || 'asc' };
    else if (sortBy === 'price') orderBy = { price: sortOrder || 'asc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit || 20,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' } },
          variants: true,
          categories: { include: { category: true } },
          brand: true,
          _count: { select: { reviews: true, orderItems: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, meta: { page: page || 1, limit: limit || 20, total, totalPages: Math.ceil(total / (limit || 20)) } };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: true,
        categories: { include: { category: true } },
        brand: true,
        reviews: {
          where: { isApproved: true, isHidden: false },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true, orderItems: true } },
      },
    });

    if (!product || product.status === 'ARCHIVED') {
      throw new NotFoundException('Product not found');
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return { ...product, averageRating: Math.round(avgRating * 10) / 10, reviewCount: ratings.length };
  }

  async findFeatured() {
    return this.prisma.product.findMany({
      where: { isFeatured: true, status: 'ACTIVE' },
      take: 12,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        brand: true,
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNewArrivals() {
    return this.prisma.product.findMany({
      where: { isNewArrival: true, status: 'ACTIVE' },
      take: 12,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        brand: true,
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBestSellers() {
    return this.prisma.product.findMany({
      where: { isBestSeller: true, status: 'ACTIVE' },
      take: 12,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        brand: true,
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSale() {
    return this.prisma.product.findMany({
      where: { isSale: true, status: 'ACTIVE', discountPrice: { not: null } },
      take: 12,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        brand: true,
        categories: { include: { category: true } },
      },
      orderBy: { discountPrice: 'asc' },
    });
  }

  async create(dto: CreateProductDto, files?: Express.Multer.File[]) {
    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) throw new ConflictException('SKU already exists');

    let slug = slugify.default(dto.name, { lower: true, strict: true });
    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        sku: dto.sku,
        price: dto.price,
        discountPrice: dto.discountPrice,
        stockQuantity: dto.stockQuantity || 0,
        material: dto.material,
        weight: dto.weight,
        careInstructions: dto.careInstructions,
        status: dto.status || 'ACTIVE',
        isFeatured: dto.isFeatured || false,
        isNewArrival: dto.isNewArrival || false,
        isBestSeller: dto.isBestSeller || false,
        isSale: dto.isSale || false,
        gender: dto.gender,
        ageGroup: dto.ageGroup,
        brandId: dto.brandId,
        images: dto.images ? { create: dto.images.map((img) => ({ url: img.url, publicId: img.publicId, alt: img.alt, order: img.order || 0 })) } : undefined,
        variants: dto.variants ? { create: dto.variants.map((v) => ({ size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock || 0, price: v.price })) } : undefined,
        categories: dto.categoryIds ? { create: dto.categoryIds.map((catId) => ({ categoryId: catId })) } : undefined,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: true,
        categories: { include: { category: true } },
        brand: true,
      },
    });

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existingSku) throw new ConflictException('SKU already exists');
    }

    const scalarFields = ['name', 'description', 'sku', 'price', 'discountPrice', 'stockQuantity', 'material', 'weight', 'careInstructions', 'video', 'status', 'isFeatured', 'isNewArrival', 'isBestSeller', 'isSale', 'gender', 'ageGroup', 'brandId'] as const;
    const data: Record<string, any> = {};
    for (const field of scalarFields) {
      if (dto[field] !== undefined) {
        data[field] = dto[field];
      }
    }

    if (dto.name && dto.name !== product.name) {
      let slug = slugify.default(dto.name, { lower: true, strict: true });
      const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
      if (existingSlug) slug = `${slug}-${Date.now()}`;
      data.slug = slug;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        categories: dto.categoryIds ? { deleteMany: {}, create: dto.categoryIds.map((catId) => ({ categoryId: catId })) } : undefined,
        images: dto.images ? { deleteMany: {}, create: dto.images.map((img) => ({ url: img.url, publicId: img.publicId, alt: img.alt, order: img.order || 0 })) } : undefined,
        variants: dto.variants ? { deleteMany: {}, create: dto.variants.map((v) => ({ size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock || 0, price: v.price })) } : undefined,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: true,
        categories: { include: { category: true } },
        brand: true,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch {}
        }
      }
    }

    await this.prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return { message: 'Product archived successfully' };
  }
}
