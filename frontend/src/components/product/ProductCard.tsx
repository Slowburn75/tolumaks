"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
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
      <div className="absolute inset-0 flex items-center justify-center bg-[#f4f4f4] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="img-aritzia absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** SSENSE-inspired: brand · name · price, quiet hover, no heavy chrome */
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
  const secondImg =
    product.images?.[1]?.url ||
    (typeof product.images?.[1] === "string" ? product.images[1] : "");
  const availableStock = product.stockQuantity ?? product.stock ?? 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Saved");
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (availableStock <= 0) {
      toast.error("Sold out");
      return;
    }
    addItem(product, 1);
    toast.success("Added to bag");
  };

  return (
    <Link
      href={"/products/" + product.slug}
      className="group block focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
    >
      <div className="relative mb-3.5 aspect-[3/4] overflow-hidden bg-[#f4f4f4]">
        <SafeImage src={imgUrl} alt={product.name} />
        {secondImg && (
          <img
            src={secondImg}
            alt=""
            className="img-aritzia absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-luxury group-hover:opacity-100"
            loading="lazy"
          />
        )}

        {(discount > 0 || product.isNewArrival) && (
          <div className="absolute left-0 top-0 flex flex-col">
            {product.isNewArrival && (
              <span className="bg-background px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em]">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="bg-foreground px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-background">
                −{discount}%
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleWishlist}
          className="absolute right-2 top-2 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-label="Wishlist"
        >
          <Heart
            className={cn("h-4 w-4", inWishlist ? "fill-foreground text-foreground" : "text-foreground")}
            strokeWidth={1.25}
          />
        </button>

        <button
          onClick={handleQuickAdd}
          disabled={availableStock <= 0}
          className="absolute inset-x-0 bottom-0 translate-y-full bg-background/95 py-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] backdrop-blur transition-transform duration-500 ease-luxury group-hover:translate-y-0 disabled:opacity-50"
        >
          {availableStock <= 0 ? "Sold out" : "Quick add"}
        </button>
      </div>

      <div className="space-y-1">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground">
            {product.brand.name}
          </p>
        )}
        <h3
          className={cn(
            "text-[13px] font-normal leading-snug text-muted-foreground line-clamp-2 transition-colors duration-300 group-hover:text-foreground",
            variant === "compact" && "text-xs"
          )}
        >
          {product.name}
        </h3>
        <div className="ssense-price flex items-baseline gap-2 pt-0.5">
          {hasDiscount ? (
            <>
              <span>{formatPrice(discountPrice)}</span>
              <span className="text-muted-foreground line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
