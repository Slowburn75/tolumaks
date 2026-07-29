"use client";

import Link from "next/link";
import Image from "next/image";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";

export default function CartPage() {
  const { items, getItemCount, getSubtotal, updateQuantity, removeItem } = useCart();
  const { settings } = useSiteSettings();
  const activeItems = items.filter((i) => !i.savedForLater);
  const subtotal = getSubtotal();
  const freeShip = settings.freeShippingThreshold || 50000;

  if (activeItems.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-5 py-28 text-center">
          <h1 className="font-display text-3xl font-normal tracking-tight">Your bag is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            When you add products, they&apos;ll appear here.
          </p>
          <Button asChild className="mt-8">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="apple-panel min-h-[calc(100vh-4rem)]">
        <div className="container-page mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
          <h1 className="text-center font-display text-3xl font-normal tracking-tight sm:text-4xl">
            Bag
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {getItemCount()} {getItemCount() === 1 ? "item" : "items"}
          </p>

          <div className="mt-12 space-y-0 border-y border-border bg-background">
            {activeItems.map((item) => {
              const img =
                item.product.images?.[0]?.url ||
                (typeof item.product.images?.[0] === "string"
                  ? item.product.images[0]
                  : "/placeholder.svg");
              return (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="grid grid-cols-[100px_1fr] gap-5 border-b border-border px-5 py-6 last:border-0 sm:grid-cols-[120px_1fr] sm:gap-6 sm:px-8"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f4]">
                    <Image src={img} alt={item.product.name} fill className="object-cover" sizes="120px" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between gap-4">
                      <div>
                        {item.product.brand && (
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
                            {item.product.brand.name}
                          </p>
                        )}
                        <Link
                          href={"/products/" + item.product.slug}
                          className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
                        >
                          {item.product.name}
                        </Link>
                        {(item.size || item.color) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-5">
                      <div className="flex items-center border border-border">
                        <button
                          className="p-2.5 hover:bg-secondary"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.size, item.color)
                          }
                        >
                          <Minus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-[2rem] text-center text-xs">{item.quantity}</span>
                        <button
                          className="p-2.5 hover:bg-secondary"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.size, item.color)
                          }
                        >
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-sm tracking-wide">
                        {formatPrice(
                          (item.product.discountPrice || item.product.price) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 space-y-4 bg-background p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Subtotal</span>
              <span className="font-display text-2xl font-normal tracking-tight">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {subtotal >= freeShip
                ? "You qualify for free delivery."
                : `${formatPrice(freeShip - subtotal)} away from free delivery.`}
            </p>
            <Button asChild className="mt-4 h-14 w-full">
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
