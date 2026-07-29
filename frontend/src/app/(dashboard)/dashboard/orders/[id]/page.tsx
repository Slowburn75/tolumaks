"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Separator } from "@/components/ui/separator";
import { ordersApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { ArrowLeft, Truck, MapPin, CreditCard, Copy } from "lucide-react";
import type { Order } from "@/types";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import toast from "react-hot-toast";

const statusSteps = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings } = useSiteSettings();
  const bank = settings.bank;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = () => {
    const id = params.id as string;
    if (!id) return;
    ordersApi
      .getOrder(id)
      .then((res) => {
        setOrder((res as { data: Order }).data ?? (res as Order));
      })
      .catch(() => {
        router.push("/dashboard/orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id, router]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("Cancel this order? Stock will be released.")) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(order.id);
      toast.success("Order cancelled");
      fetchOrder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  if (!order)
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Order not found</div>
      </DashboardLayout>
    );

  const stepIndex = Math.max(
    0,
    statusSteps.findIndex((s) => s === order.status)
  );
  const currentStep = order.status === "CANCELLED" ? -1 : stepIndex;
  const awaitingPayment = order.status === "PENDING" && order.paymentStatus === "PENDING";
  const canCancel = awaitingPayment;

  const payment = (order as Order & { payment?: { provider?: string; reference?: string; status?: string } })
    .payment;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link
          href="/dashboard/orders"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              {canCancel && (
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {order.status !== "CANCELLED" && (
              <div className="relative py-4">
                <div className="flex justify-between">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          i <= currentStep
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs mt-2 capitalize text-center max-w-[4.5rem]">
                        {step.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(Math.max(currentStep, 0) / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {awaitingPayment && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm">Complete bank transfer</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transfer <strong>{formatPrice(Number(order.total))}</strong> and use order number{" "}
                      <strong>{order.orderNumber}</strong> as the reference.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 shrink-0"
                    onClick={() => copy("Order number", order.orderNumber)}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy ref
                  </Button>
                </div>
                <div className="text-sm space-y-1 border-t border-amber-200/80 dark:border-amber-900 pt-3">
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
                    <div className="flex items-center gap-1">
                      <span className="font-medium tracking-wide">
                        {bank.accountNumber}
                      </span>
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
                <p className="text-xs text-muted-foreground">{bank.note}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 border rounded-lg p-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress?.fullName ||
                      `${order.shippingAddress?.firstName || ""} ${order.shippingAddress?.lastName || ""}`.trim()}
                    <br />
                    {order.shippingAddress?.street}
                    <br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border rounded-lg p-4">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Payment</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {(payment?.provider || order.paymentMethod || "bank_transfer").replace(/_/g, " ")}
                  </p>
                  <OrderStatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center gap-3 bg-muted rounded-lg p-4">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm text-muted-foreground">{order.trackingNumber}</p>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Order Items ({order.items?.length || 0})</h4>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border rounded-lg p-4">
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden shrink-0">
                      <img
                        src={
                          item.image ||
                          item.product?.images?.[0]?.url ||
                          (typeof item.product?.images?.[0] === "string"
                            ? item.product.images[0]
                            : undefined) ||
                          "/placeholder.svg"
                        }
                        alt={item.product?.name || item.name || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.product?.name || item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} x {formatPrice(Number(item.price))}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {(order.shippingFee ?? order.shipping ?? 0) === 0
                    ? "Free"
                    : formatPrice(Number(order.shippingFee ?? order.shipping ?? 0))}
                </span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(Number(order.discount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
