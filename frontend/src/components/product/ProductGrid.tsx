"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, isLoading, columns = 3 }: ProductGridProps) {
  if (isLoading) return <ProductGridSkeleton count={12} />;

  if (!products || products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm tracking-wide text-muted-foreground">No products found.</p>
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
