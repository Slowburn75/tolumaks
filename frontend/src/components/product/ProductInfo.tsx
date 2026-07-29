"use client";

import { formatPrice, calculateDiscount } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const availableStock = product.stockQuantity ?? product.stock ?? 0;
  const rating = product.averageRating ?? product.rating ?? 0;
  const reviewCount = product.reviewCount ?? product._count?.reviews ?? 0;
  const discountPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < Number(product.price);
  const discount = hasDiscount ? calculateDiscount(product.price, discountPrice) : 0;

  return (
    <div className="space-y-5">
      {product.brand && (
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground">
          {product.brand.name}
        </p>
      )}
      <h1 className="font-display text-3xl font-normal leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
        {product.name}
      </h1>
      <div className="flex flex-wrap items-baseline gap-3">
        {hasDiscount ? (
          <>
            <span className="text-lg tracking-wide">{formatPrice(discountPrice)}</span>
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              −{discount}%
            </span>
          </>
        ) : (
          <span className="text-lg tracking-wide">{formatPrice(product.price)}</span>
        )}
      </div>
      {reviewCount > 0 && (
        <p className="text-xs tracking-wide text-muted-foreground">
          {rating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </p>
      )}
      <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground line-clamp-4">
        {product.description}
      </p>
      <p className="text-xs tracking-wide text-muted-foreground">
        {availableStock > 0 ? "In stock" : "Sold out"}
      </p>
    </div>
  );
}
