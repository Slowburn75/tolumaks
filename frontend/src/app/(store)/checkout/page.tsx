"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { useAuthStore } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Apple-inspired checkout shell: calm, centered, minimal chrome */
export default function CheckoutPage() {
  const { isAuthenticated } = useAuthStore();
  const { items } = useCart();
  const router = useRouter();
  const activeItems = items.filter((i) => !i.savedForLater);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md px-5 py-28 text-center">
          <h1 className="font-display text-3xl font-normal tracking-tight">Sign in to checkout</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please sign in to complete your order.
          </p>
          <Button asChild className="mt-8">
            <Link href="/login?redirect=/checkout">Sign in</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  if (activeItems.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md px-5 py-28 text-center">
          <h1 className="font-display text-3xl font-normal tracking-tight">Your bag is empty</h1>
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
        <div className="container-page mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
          <h1 className="text-center font-display text-3xl font-normal tracking-tight sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Review your order and place it securely.
          </p>
          <div className="mt-12">
            <CheckoutForm />
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
