"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { SizeSelector } from "@/components/product/SizeSelector";
import { ColorSelector } from "@/components/product/ColorSelector";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { WishlistButton } from "@/components/product/WishlistButton";
import { ReviewCard } from "@/components/product/ReviewCard";
import { ReviewForm } from "@/components/product/ReviewForm";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import toast from "react-hot-toast";

/** Nike-inspired PDP: immersive media, sticky buy panel, bold CTAs */
export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const availableSizes = Array.from(
    new Set(product?.variants?.map((v: any) => v.size).filter(Boolean) || [])
  ) as string[];
  const availableColors = Array.from(
    new Set(product?.variants?.map((v: any) => v.color).filter(Boolean) || [])
  ) as string[];

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res: any = await productsApi.getProduct(slug);
        setProduct(res?.data || res);
      } catch {
        setProduct(null);
      }
      try {
        const relatedRes: any = await productsApi.getRelated(slug);
        const list = Array.isArray(relatedRes) ? relatedRes : relatedRes?.data || [];
        setRelated(Array.isArray(list) ? list : list?.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error("Select a size");
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success("Added to bag");
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error("Select a size");
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
    window.location.href = "/checkout";
  };

  const handleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Saved");
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="container-page px-5 py-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/5] animate-pulse bg-[#f0f0f0]" />
            <div className="space-y-4 pt-4">
              <div className="h-3 w-24 animate-pulse bg-[#f0f0f0]" />
              <div className="h-10 w-3/4 animate-pulse bg-[#f0f0f0]" />
              <div className="h-5 w-1/3 animate-pulse bg-[#f0f0f0]" />
              <div className="h-32 animate-pulse bg-[#f0f0f0]" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container-page px-5 py-28 text-center">
          <h1 className="font-display text-3xl font-normal">Product not found</h1>
          <Link
            href="/shop"
            className="mt-6 inline-block text-[10px] font-medium uppercase tracking-[0.22em] underline underline-offset-4"
          >
            Back to shop
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const productImages = (product.images?.map((img: any) => img.url || img).filter(Boolean) ||
    []) as string[];
  const availableStock = product.stockQuantity ?? product.stock ?? 0;
  const reviewCount =
    product.reviewCount ?? product._count?.reviews ?? product.reviews?.length ?? 0;
  const price = Number(product.discountPrice || product.price);

  return (
    <StoreLayout>
      <div className="container-page px-5 pb-20 pt-8 sm:px-8 lg:px-12 lg:pb-28 lg:pt-12 xl:px-16">
        <nav className="mb-8 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:gap-20">
          <div className="min-w-0">
            {productImages.length > 0 && (
              <ProductGallery images={productImages} productName={product.name} />
            )}
            {product.video && (
              <div className="mt-3 aspect-video overflow-hidden bg-black">
                <video controls className="h-full w-full object-contain">
                  <source src={product.video} />
                </video>
              </div>
            )}
            {productImages.length === 0 && !product.video && (
              <ProductGallery images={[]} productName={product.name} />
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start lg:pt-2">
            <ProductInfo product={product} />

            <div className="mt-8 space-y-7 border-t border-border pt-8">
              {availableSizes.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em]">
                      Select size
                    </p>
                    {selectedSize && (
                      <p className="text-[11px] tracking-wide text-muted-foreground">
                        {selectedSize}
                      </p>
                    )}
                  </div>
                  <SizeSelector
                    selectedSize={selectedSize}
                    onSelect={setSelectedSize}
                    availableSizes={availableSizes}
                  />
                </div>
              )}

              {availableColors.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em]">
                    Select colour
                  </p>
                  <ColorSelector selectedColor={selectedColor} onSelect={setSelectedColor} />
                </div>
              )}

              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em]">Quantity</p>
                <QuantitySelector value={quantity} onChange={setQuantity} max={availableStock} />
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  className="h-14 w-full text-[11px]"
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                >
                  {availableStock <= 0 ? "Sold out" : `Add to bag — ${formatPrice(price)}`}
                </Button>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14"
                    onClick={handleBuyNow}
                    disabled={availableStock <= 0}
                  >
                    Buy now
                  </Button>
                  <WishlistButton
                    isInWishlist={isInWishlist(product.id)}
                    onClick={handleWishlist}
                    size="icon"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
                <p>Free delivery on qualifying orders</p>
                <p>30-day returns</p>
                {product.material && <p>Material: {product.material}</p>}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mt-20 border-t border-border pt-12">
          <TabsList className="flex h-auto flex-wrap justify-start gap-8 rounded-none border-0 bg-transparent p-0">
            {["description", "specifications", "delivery", "reviews"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-0 border-b border-transparent px-0 pb-3 text-[11px] font-medium uppercase tracking-[0.16em] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab === "reviews" ? `Reviews (${reviewCount})` : tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="description" className="mt-8 max-w-2xl">
            <p className="text-[15px] leading-[1.85] text-muted-foreground">{product.description}</p>
          </TabsContent>
          <TabsContent value="specifications" className="mt-8">
            <div className="grid max-w-xl gap-6 sm:grid-cols-2">
              {product.material && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Material</p>
                  <p className="mt-2 text-sm text-muted-foreground">{product.material}</p>
                </div>
              )}
              {product.weight && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Weight</p>
                  <p className="mt-2 text-sm text-muted-foreground">{product.weight}</p>
                </div>
              )}
              {product.careInstructions && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Care</p>
                  <p className="mt-2 text-sm text-muted-foreground">{product.careInstructions}</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="delivery" className="mt-8">
            <div className="grid max-w-2xl gap-px bg-border sm:grid-cols-2">
              {[
                ["Standard", "5–7 business days"],
                ["Express", "1–2 business days"],
                ["Free shipping", "On qualifying orders"],
                ["Returns", "30-day return policy"],
              ].map(([t, d]) => (
                <div key={t} className="bg-background p-6">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em]">{t}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-8 space-y-8">
            <ReviewForm productId={product.id} />
            <div className="space-y-4">
              {product.reviews?.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {(!product.reviews || product.reviews.length === 0) && (
                <p className="py-12 text-center text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <RelatedProducts products={related} />
      </div>
    </StoreLayout>
  );
}
