"use client";

import { cn } from "@/lib/utils";
import { sizes } from "@/lib/constants";

interface SizeSelectorProps {
  selectedSize?: string;
  onSelect: (size: string) => void;
  availableSizes?: string[];
}

/** Nike-style size tiles */
export function SizeSelector({
  selectedSize,
  onSelect,
  availableSizes = sizes,
}: SizeSelectorProps) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {availableSizes.map((size) => (
          <button
            key={size}
            type="button"
            className={cn(
              "flex h-12 items-center justify-center border text-sm tracking-wide transition-colors duration-300",
              selectedSize === size
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground"
            )}
            onClick={() => onSelect(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
