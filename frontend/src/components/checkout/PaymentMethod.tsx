"use client";

import { Building2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { paymentMethods } from "@/lib/constants";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";

interface PaymentMethodProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethod({ value, onChange }: PaymentMethodProps) {
  const { settings } = useSiteSettings();
  const bank = settings.bank;

  return (
    <div className="space-y-4">
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {paymentMethods.map((method) => (
          <Label
            key={method.id}
            className={cn(
              "flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
              value === method.id && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value={method.id} className="mt-0" />
            <div className="flex items-center gap-3 flex-1">
              <Building2 className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">{method.name}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
            </div>
          </Label>
        ))}
      </RadioGroup>

      {value === "bank_transfer" && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <h4 className="font-medium text-sm">Bank Transfer Details</h4>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{bank.bankName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium text-right">{bank.accountName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-medium tracking-wide">{bank.accountNumber}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-3">{bank.note}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Card payments (Paystack / Flutterwave) will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}
