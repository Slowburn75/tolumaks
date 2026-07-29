"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-secondary text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const discountPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < Number(product.price);
  const discount = hasDiscount ? calculateDiscount(product.price, discountPrice) : 0;
  const imgUrl =
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : "");
  const availableStock = product.stockQuantity ?? product.stock ?? 0;
  const reviewCount = product.reviewCount ?? product._count?.reviews ?? 0;
  const rating = product.averageRating ?? product.rating ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (availableStock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    addItem(product, 1);
    toast.success("Added to cart");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  return (
    <Link
      href={"/products/" + product.slug}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-soft transition-all duration-500 group-hover:shadow-lift">
        <SafeImage src={imgUrl} alt={product.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge variant="destructive" className="rounded-full px-2.5 shadow-sm">
              −{discount}%
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="rounded-full bg-white text-black hover:bg-white shadow-sm">New</Badge>
          )}
          {product.isBestSeller && (
            <Badge variant="secondary" className="rounded-full shadow-sm">
              Bestseller
            </Badge>
          )}
        </div>

        <button
          onClick={handleWishlist}
          className="absolute right-3 top-3 rounded-full bg-white/95 p-2.5 text-foreground shadow-soft backdrop-blur transition-all hover:scale-105"
          aria-label="Toggle wishlist"
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-foreground")} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button
              size="sm"
              className="h-11 gap-2 rounded-full shadow-soft"
              onClick={handleAddToCart}
              disabled={availableStock <= 0}
            >
              <ShoppingBag className="h-4 w-4" />
              Quick add
            </Button>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground shadow-soft">
              <Eye className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-0.5">
        <div className="flex items-center justify-between gap-2">
          {product.brand && (
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {product.brand.name}
            </p>
          )}
          <span
            className={cn(
              "shrink-0 text-[10px] font-medium uppercase tracking-[0.14em]",
              availableStock > 0 ? "text-emerald-700" : "text-destructive"
            )}
          >
            {availableStock > 0 ? "In stock" : "Sold out"}
          </span>
        </div>
        <h3
          className={cn(
            "font-medium leading-snug text-foreground/95 line-clamp-2 transition-colors group-hover:text-foreground",
            variant === "compact" ? "text-sm" : "text-[15px]"
          )}
        >
          {product.name}
        </h3>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(rating) ? "fill-gold text-gold" : "text-border"
                )}
              />
            ))}
            <span className="ml-1 text-xs">({reviewCount})</span>
          </div>
        )}
        <div className="flex items-baseline gap-2 pt-0.5">
          {hasDiscount ? (
            <>
              <span className="text-base font-semibold tracking-tight">
                {formatPrice(discountPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-base font-semibold tracking-tight">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
