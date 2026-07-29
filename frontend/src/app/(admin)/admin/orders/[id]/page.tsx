"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { ArrowLeft, MapPin, CreditCard, Truck, Banknote } from "lucide-react";
import type { Order } from "@/types";
import { orderStatuses } from "@/lib/constants";
import toast from "react-hot-toast";

function addressLines(addr: Order["shippingAddress"]) {
  if (!addr) return "—";
  const name =
    addr.fullName ||
    `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
    "—";
  return (
    <>
      {name}
      <br />
      {addr.street}
      <br />
      {addr.city}, {addr.state}
      {addr.phone ? (
        <>
          <br />
          {addr.phone}
        </>
      ) : null}
    </>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchOrder = () => {
    adminApi
      .getOrder(params.id as string)
      .then((res: unknown) => {
        setOrder((res as { data?: Order })?.data || (res as Order));
      })
      .catch(() => router.push("/admin/orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleStatusChange = async (status: string) => {
    try {
      await adminApi.updateOrderStatus(params.id as string, status);
      toast.success("Status updated");
      fetchOrder();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await adminApi.confirmBankPayment(params.id as string);
      toast.success("Bank transfer confirmed — order marked as paid");
      fetchOrder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </AdminLayout>
    );
  if (!order)
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">Order not found</div>
      </AdminLayout>
    );

  const paymentProvider =
    (order as Order & { payment?: { provider?: string; status?: string; reference?: string } }).payment
      ?.provider ||
    order.paymentMethod ||
    "bank_transfer";
  const paymentStatus = order.paymentStatus;
  const awaitingBank =
    paymentStatus === "PENDING" &&
    order.status === "PENDING" &&
    (paymentProvider === "bank_transfer" || !order.paymentMethod);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link
          href="/admin/orders"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusBadge status={order.status} />
              <Select value={order.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {awaitingBank && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-amber-700 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Awaiting bank transfer</p>
                    <p className="text-sm text-muted-foreground">
                      Confirm once you have received {formatPrice(Number(order.total))} with reference{" "}
                      <strong>{order.orderNumber}</strong>.
                    </p>
                  </div>
                </div>
                <Button onClick={handleConfirmPayment} disabled={confirming} className="shrink-0">
                  {confirming ? "Confirming..." : "Confirm Payment Received"}
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Shipping Address</h4>
                </div>
                <p className="text-sm text-muted-foreground">{addressLines(order.shippingAddress)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Payment</h4>
                </div>
                <p className="text-sm text-muted-foreground capitalize mb-1">
                  {String(paymentProvider).replace(/_/g, " ")}
                </p>
                <OrderStatusBadge status={paymentStatus} />
                {(order as { payment?: { reference?: string } }).payment?.reference && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ref: {(order as { payment?: { reference?: string } }).payment?.reference}
                  </p>
                )}
              </div>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center gap-3 bg-muted rounded-lg p-4">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tracking: {order.trackingNumber}</p>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Items ({order.items?.length || 0})</h4>
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
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.product?.name || item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} x {formatPrice(Number(item.price))}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.color ? ` · ${item.color}` : ""}
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
    </AdminLayout>
  );
}
