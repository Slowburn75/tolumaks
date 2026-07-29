"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";

/** Apple-inspired bag: calm, sparse, typography-led */
export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, getSubtotal } = useCart();
  const { settings } = useSiteSettings();
  const activeItems = items.filter((i) => !i.savedForLater);
  const subtotal = getSubtotal();
  const freeShippingTarget = settings.freeShippingThreshold || 50000;
  const remaining = Math.max(0, freeShippingTarget - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col border-l border-border p-0 sm:max-w-[420px]">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-6 py-5 text-left">
          <SheetTitle className="text-[11px] font-medium uppercase tracking-[0.2em]">
            Bag · {activeItems.length}
          </SheetTitle>
        </SheetHeader>

        {activeItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-2xl font-normal tracking-tight">Your bag is empty</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Explore the latest edit and add something you love.
            </p>
            <Button asChild className="mt-8" onClick={() => setOpen(false)}>
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {subtotal < freeShippingTarget && (
              <div className="border-b border-border px-6 py-4">
                <p className="text-center text-[12px] tracking-wide text-muted-foreground">
                  {formatPrice(remaining)} away from free delivery
                </p>
                <div className="mt-3 h-px overflow-hidden bg-border">
                  <div
                    className="h-full bg-foreground transition-all duration-700 ease-luxury"
                    style={{
                      width: `${Math.min(100, (subtotal / freeShippingTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-0 overflow-y-auto">
              {activeItems.map((item) => {
                const img =
                  item.product.images?.[0]?.url ||
                  (typeof item.product.images?.[0] === "string"
                    ? item.product.images[0]
                    : "/placeholder.svg");
                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="grid grid-cols-[88px_1fr] gap-4 border-b border-border px-6 py-5"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f4f4]">
                      <Image
                        src={img}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="88px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {item.product.brand && (
                            <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
                              {item.product.brand.name}
                            </p>
                          )}
                          <Link
                            href={"/products/" + item.product.slug}
                            className="mt-1 block text-sm leading-snug text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                          >
                            {item.product.name}
                          </Link>
                          {(item.size || item.color) && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.size, item.color)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label="Remove"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex items-center border border-border">
                          <button
                            className="p-2 hover:bg-secondary"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.size, item.color)
                            }
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-xs">{item.quantity}</span>
                          <button
                            className="p-2 hover:bg-secondary"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.size, item.color)
                            }
                            aria-label="Increase"
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

            <div className="border-t border-border bg-background px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Subtotal</span>
                <span className="font-display text-xl font-normal tracking-tight">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="mt-6 space-y-3">
                <Button asChild className="h-14 w-full" onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/cart">Review bag</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
