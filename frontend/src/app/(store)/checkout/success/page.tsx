"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ordersApi } from "@/lib/api";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import toast from "react-hot-toast";

export default function CheckoutSuccessPage() {
  const { settings } = useSiteSettings();
  const bank = settings.bank;
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumberParam = searchParams.get("orderNumber");
  const totalParam = searchParams.get("total");

  const [orderNumber, setOrderNumber] = useState(orderNumberParam || "");
  const [total, setTotal] = useState(totalParam ? Number(totalParam) : 0);

  useEffect(() => {
    if (!orderId || (orderNumberParam && totalParam)) return;
    ordersApi
      .getOrder(orderId)
      .then((res: unknown) => {
        const order = (res as { data?: { orderNumber?: string; total?: number | string } })?.data ?? res;
        const o = order as { orderNumber?: string; total?: number | string };
        if (o.orderNumber) setOrderNumber(o.orderNumber);
        if (o.total != null) setTotal(Number(o.total));
      })
      .catch(() => {});
  }, [orderId, orderNumberParam, totalParam]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <StoreLayout>
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Your order is awaiting bank transfer. Complete payment using the details below so we can
            process it.
          </p>
        </div>

        <div className="border rounded-xl p-6 space-y-4 bg-muted/30 mb-8">
          <div className="flex justify-between items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Order number</p>
              <p className="font-semibold text-lg">{orderNumber || "—"}</p>
            </div>
            {orderNumber && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => copy("Order number", orderNumber)}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            )}
          </div>

          {total > 0 && (
            <div className="flex justify-between border-t pt-4">
              <span className="text-muted-foreground">Amount to transfer</span>
              <span className="font-semibold text-lg">{formatPrice(total)}</span>
            </div>
          )}

          <div className="border-t pt-4 space-y-2 text-sm">
            <h3 className="font-medium">Bank details</h3>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{bank.bankName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Account name</span>
              <span className="font-medium text-right">{bank.accountName}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground">Account number</span>
              <div className="flex items-center gap-2">
                <span className="font-medium tracking-wide">{bank.accountNumber}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => copy("Account number", bank.accountNumber)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-4">
            {bank.note} Use <strong>{orderNumber || "your order number"}</strong> as
            the transfer reference.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}>
            <Button className="gap-2 w-full sm:w-auto">
              <Package className="h-4 w-4" /> View Order
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}
