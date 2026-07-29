"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressForm, type AddressFormData } from "@/components/checkout/AddressForm";
import { DeliveryMethod } from "@/components/checkout/DeliveryMethod";
import { PaymentMethod } from "@/components/checkout/PaymentMethod";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCart } from "@/hooks/useCart";
import { ordersApi, unwrapData } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { calculateShippingFee, deliveryMethods } from "@/lib/constants";
import toast from "react-hot-toast";

const steps = ["Shipping", "Delivery", "Payment", "Review"];

export function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressFormData | null>(null);
  const [delivery, setDelivery] = useState("standard");
  const [payment] = useState("bank_transfer");
  const [loading, setLoading] = useState(false);

  const activeItems = items.filter((i) => !i.savedForLater);
  const subtotal = getSubtotal();
  const shipping = calculateShippingFee(delivery, subtotal);
  const total = Math.max(0, subtotal + shipping);
  const deliveryLabel = deliveryMethods.find((d) => d.id === delivery)?.name || "Standard Delivery";

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error("Please add a shipping address");
      setStep(0);
      return;
    }

    setLoading(true);
    try {
      const created = unwrapData<{
        id: string;
        orderNumber: string;
        total: number | string;
      }>(
        await ordersApi.createOrder({
          items: activeItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          shippingAddress: address,
          deliveryMethod: delivery,
          paymentMethod: "bank_transfer",
        })
      );

      const createdOrderId = created.id;
      const orderNumber = created.orderNumber;
      if (!createdOrderId) throw new Error("Order ID missing");

      await clearCart();
      toast.success("Order placed — complete your bank transfer to confirm");
      const params = new URLSearchParams({
        orderId: createdOrderId,
        ...(orderNumber ? { orderNumber } : {}),
        total: String(created.total ?? total),
      });
      router.push(`/checkout/success?${params.toString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2",
                  i <= step ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    i < step || i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-8 sm:w-16 h-px bg-muted mx-2" />}
            </div>
          ))}
        </div>

        <div>
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
              <AddressForm
                onSubmit={(data) => {
                  setAddress(data);
                  setStep(1);
                }}
                defaultValues={address || undefined}
              />
            </div>
          )}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Delivery Method</h2>
              <DeliveryMethod value={delivery} onChange={setDelivery} subtotal={subtotal} />
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
              <PaymentMethod value={payment} onChange={() => {}} />
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Review Order</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
              <div className="space-y-4 border rounded-lg p-6">
                <div>
                  <h3 className="font-medium mb-2">Shipping To</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{address ? `${address.firstName} ${address.lastName}` : ""}</p>
                    <p>
                      {address?.street}, {address?.city}
                    </p>
                    <p>
                      {address?.state}, {address?.country}
                    </p>
                    <p>{address?.phone}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Delivery: {deliveryLabel}</h3>
                  <p className="text-sm text-muted-foreground">
                    Shipping: {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Payment: Bank Transfer</h3>
                  <p className="text-sm text-muted-foreground">
                    After placing your order you will see bank details and your order number to use as
                    the transfer reference.
                  </p>
                </div>
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Total to transfer</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? "Placing order..." : "Place Order"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <OrderSummary
          items={activeItems as never}
          subtotal={subtotal}
          shipping={shipping}
          discount={0}
          total={total}
          onPlaceOrder={handlePlaceOrder}
          isLoading={loading}
          placeOrderLabel={step === 3 ? "Place Order" : "Complete checkout steps"}
          placeOrderDisabled={step !== 3}
        />
      </div>
    </div>
  );
}
