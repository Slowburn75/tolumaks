"use client";

import { useEffect, useState } from "react";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductSort } from "@/components/product/ProductSort";
import { ProductSearch } from "@/components/product/ProductSearch";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import type { Product, ProductFilters as Filters } from "@/types";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** SSENSE-inspired: sparse header, refined filters, clean dense grid */
export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get("category") || undefined,
    gender: searchParams.get("gender") || undefined,
    search: searchParams.get("search") || undefined,
    isOnSale: searchParams.get("sale") === "true" || undefined,
    isNewArrival: searchParams.get("isNewArrival") === "true" || undefined,
    isBestSeller: searchParams.get("isBestSeller") === "true" || undefined,
  });
  const [sort, setSort] = useState("latest");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let ageGroup = filters.ageGroup?.toUpperCase();
      if (ageGroup === "KIDS" || ageGroup === "KID") ageGroup = "CHILDREN";

      const apiFilters: Record<string, string | number | boolean | undefined> = {
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { categorySlug: filters.category }),
        ...(filters.gender && { gender: filters.gender.toUpperCase() }),
        ...(ageGroup && { ageGroup }),
        ...(filters.minPrice !== undefined && { minPrice: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
        ...(filters.brand && { brandSlug: filters.brand }),
        ...(filters.colors && filters.colors.length > 0 && { colors: filters.colors.join(",") }),
        ...(filters.sizes && filters.sizes.length > 0 && { sizes: filters.sizes.join(",") }),
        ...(filters.isOnSale && { isSale: true }),
        ...(filters.isNewArrival && { isNewArrival: true }),
        ...(filters.isBestSeller && { isBestSeller: true }),
        ...(sort !== "latest" && { sortBy: sort }),
        page: pagination.page,
        limit: 24,
      };
      const res: any = await productsApi.getProducts(apiFilters);
      const payload = res?.success !== undefined ? res.data : res;
      const data = Array.isArray(payload) ? payload : payload?.data || [];
      setProducts(data);
      const meta = payload?.meta || res?.meta;
      if (meta) setPagination({ page: meta.page || 1, totalPages: meta.totalPages || 1 });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, sort, pagination.page]);

  const onFilterChange = (f: Filters) => {
    setFilters(f);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <StoreLayout>
      <div className="container-page px-5 pt-10 sm:px-8 lg:px-12 lg:pt-14 xl:px-16">
        <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow-dior">Shop</p>
            <h1 className="mt-3 font-display text-4xl font-normal tracking-tight sm:text-5xl">
              All products
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {loading ? "Loading…" : `${products.length} results`}
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:max-w-none">
            <div className="min-w-[220px] flex-1">
              <ProductSearch onSearch={(q) => onFilterChange({ ...filters, search: q })} />
            </div>
            <ProductSort value={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      <div className="container-page px-5 py-10 sm:px-8 lg:px-12 lg:py-12 xl:px-16">
        <div className="flex gap-10 lg:gap-14">
          {/* Desktop filters — SSENSE thin left rail */}
          <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
            <div className="sticky top-24">
              <ProductFilters filters={filters} onChange={onFilterChange} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Mobile filter trigger */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100%,320px)] overflow-y-auto rounded-none p-6">
                  <SheetHeader className="mb-6 text-left">
                    <SheetTitle className="text-xs font-medium uppercase tracking-[0.2em]">
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <ProductFilters filters={filters} onChange={onFilterChange} />
                </SheetContent>
              </Sheet>
            </div>

            <ProductGrid products={products} isLoading={loading} columns={3} />

            {pagination.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-6 border-t border-border pt-10">
                <button
                  className="text-[10px] font-medium uppercase tracking-[0.2em] disabled:opacity-30"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground tracking-wide">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className="text-[10px] font-medium uppercase tracking-[0.2em] disabled:opacity-30"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
