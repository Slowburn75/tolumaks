"use client";

import { Truck, Zap, Store } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import {
  calculateShippingFee,
  deliveryMethods,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/constants";

interface DeliveryMethodProps {
  value: string;
  onChange: (value: string) => void;
  subtotal?: number;
}

const icons: Record<string, React.ReactNode> = {
  standard: <Truck className="h-5 w-5" />,
  express: <Zap className="h-5 w-5" />,
  pickup: <Store className="h-5 w-5" />,
};

export function DeliveryMethod({ value, onChange, subtotal = 0 }: DeliveryMethodProps) {
  return (
    <div className="space-y-3">
      {subtotal >= FREE_SHIPPING_THRESHOLD && (
        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
          Free shipping unlocked on orders of {formatPrice(FREE_SHIPPING_THRESHOLD)}+
        </p>
      )}
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {deliveryMethods.map((method) => {
          const fee = calculateShippingFee(method.id, subtotal);
          return (
            <Label
              key={method.id}
              className={cn(
                "flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                value === method.id && "border-primary bg-primary/5"
              )}
            >
              <RadioGroupItem value={method.id} className="mt-0" />
              <div className="flex-1 flex items-center gap-3">
                {icons[method.id]}
                <div className="flex-1">
                  <p className="text-sm font-medium">{method.name}</p>
                  <p className="text-xs text-muted-foreground">{method.days}</p>
                </div>
                <span className="font-medium text-sm">
                  {fee === 0 ? "Free" : formatPrice(fee)}
                </span>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
