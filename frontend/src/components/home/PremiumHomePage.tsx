"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { bannersApi, productsApi } from "@/lib/api";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import type { Product } from "@/types";

const bg = (image: string) => ({ backgroundImage: "url(" + image + ")" });

type HeroSlide = {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  links: Array<{ label: string; href: string }>;
};

const defaultHeroSlides: HeroSlide[] = [
  {
    eyebrow: "New season edit",
    title: "Style that moves like confidence.",
    copy: "Premium fashion, shoes, bags, and everyday essentials curated for a sharper wardrobe.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=85",
    links: [
      { label: "Shop Women", href: "/shop?gender=female" },
      { label: "Shop Men", href: "/shop?gender=male" },
      { label: "Shop Kids", href: "/shop?ageGroup=children" },
    ],
  },
  {
    eyebrow: "Quiet luxury",
    title: "Modern essentials, elevated.",
    copy: "Clean silhouettes and refined materials that look expensive without trying too hard.",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2200&q=85",
    links: [
      { label: "New Arrivals", href: "/shop?isNewArrival=true" },
      { label: "Best Sellers", href: "/shop?isBestSeller=true" },
      { label: "Sale", href: "/shop?sale=true" },
    ],
  },
];

function pickList<T>(res: unknown): T[] {
  let payload: unknown = res;
  if (res && typeof res === "object" && "success" in res && "data" in res) {
    payload = (res as { data: unknown }).data;
  }
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

const promiseIcons = [ShieldCheck, Truck, CheckCircle2, Sparkles];

export function PremiumHomePage() {
  const { settings } = useSiteSettings();
  const hp = settings.homepage;
  const [active, setActive] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultHeroSlides);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  const categories =
    hp.categoryCards?.length > 0
      ? hp.categoryCards
      : [
          {
            name: "Women",
            href: "/shop?gender=female",
            image:
              "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85",
            copy: "Dresses, sets, bags, and elevated daily wear.",
          },
        ];

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % Math.max(heroSlides.length, 1)),
      6500
    );
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    productsApi
      .getNewArrivals(4)
      .then((res) => setNewArrivals(pickList<Product>(res)))
      .catch(() => setNewArrivals([]));
    productsApi
      .getBestSellers(4)
      .then((res) => setBestSellers(pickList<Product>(res)))
      .catch(() => setBestSellers([]));
    bannersApi
      .getActive()
      .then((res) => {
        const list = pickList<{
          title: string;
          subtitle?: string;
          image: string;
          link?: string;
        }>(res);
        if (list.length) {
          setHeroSlides(
            list.map((b) => ({
              eyebrow: "Featured",
              title: b.title,
              copy: b.subtitle || settings.storeTagline || "Discover the latest from Tolumak.",
              image: b.image,
              links: [{ label: "Shop now", href: b.link || "/shop" }],
            }))
          );
          setActive(0);
        }
      })
      .catch(() => {});
  }, [settings.storeTagline]);

  const slide = heroSlides[active] || defaultHeroSlides[0];
  const promises = hp.promises?.length ? hp.promises : [];
  const featureCards = hp.featureCards || [];
  const testimonials = hp.testimonials || [];
  const galleryImages = hp.galleryImages || [];
  const promo = hp.promo;

  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[92vh] bg-[#0c0b0a] text-white">
        {heroSlides.map((item, index) => (
          <div
            key={item.title + index}
            className={
              "absolute inset-0 transition-opacity duration-[1200ms] " +
              (index === active ? "opacity-100" : "opacity-0")
            }
          >
            <div className="absolute inset-0 bg-cover bg-center" style={bg(item.image)} />
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(12,11,10,.82)_0%,rgba(12,11,10,.45)_48%,rgba(12,11,10,.15)_100%)]" />
          </div>
        ))}

        <div className="container-page relative flex min-h-[92vh] flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-20">
          <div className="max-w-3xl animate-fade-up">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">
              {slide.eyebrow}
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-medium leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/72 sm:text-lg">
              {slide.copy}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {slide.links.map((link, index) => (
                <Button
                  key={link.href + link.label}
                  asChild
                  size="lg"
                  variant={index === 0 ? "default" : "outline"}
                  className={
                    index === 0
                      ? "h-12 rounded-full bg-white px-7 text-black hover:bg-white/90"
                      : "h-12 rounded-full border-white/30 bg-white/10 px-7 text-white backdrop-blur hover:bg-white hover:text-black"
                  }
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-12 flex items-center gap-2.5">
            {heroSlides.map((item, index) => (
              <button
                key={item.title + index}
                aria-label={"Show slide " + (index + 1)}
                onClick={() => setActive(index)}
                className={
                  "h-1 rounded-full transition-all duration-300 " +
                  (index === active ? "w-12 bg-white" : "w-6 bg-white/35 hover:bg-white/60")
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Shop the edit</p>
              <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Editorial categories
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-6 lg:gap-5">
            {categories.map((cat, index) => (
              <Link
                key={cat.name + index}
                href={cat.href}
                className={
                  "group relative min-h-[340px] overflow-hidden rounded-3xl bg-muted shadow-soft " +
                  (index < 2 ? "md:col-span-3" : "md:col-span-2")
                }
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={bg(cat.image)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                    {settings.storeName}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-medium">{cat.name}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">{cat.copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductStrip
        title="New arrivals"
        eyebrow="Fresh now"
        href="/shop?isNewArrival=true"
        products={newArrivals}
      />

      {/* PROMO + FEATURES */}
      <section className="section-pad pt-4">
        <div className="container-page grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <Link
            href={promo?.href || "/shop?isBestSeller=true"}
            className="group relative min-h-[560px] overflow-hidden rounded-3xl bg-black text-white shadow-soft lg:min-h-[620px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={bg(promo?.image || defaultHeroSlides[0].image)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-0 max-w-xl p-7 sm:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                {promo?.eyebrow || "Trending collection"}
              </p>
              <h2 className="mt-4 font-display text-4xl font-medium leading-tight sm:text-5xl">
                {promo?.title || "Built for the daily spotlight."}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">{promo?.copy}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium">
                {promo?.cta || "Explore best sellers"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {featureCards.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative min-h-[260px] overflow-hidden rounded-3xl bg-muted shadow-soft lg:min-h-[290px]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={bg(item.image)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <h3 className="font-display text-2xl font-medium sm:text-3xl">{item.title}</h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/65">Shop now</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductStrip
        title="Best sellers"
        eyebrow="Customer favorites"
        href="/shop?isBestSeller=true"
        products={bestSellers}
        muted
      />

      {/* PROMISES */}
      {promises.length > 0 && (
        <section className="section-pad">
          <div className="container-page">
            <div className="grid gap-6 rounded-3xl border border-border/70 bg-card p-8 shadow-soft sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
              {promises.map((item, i) => {
                const Icon = promiseIcons[i % promiseIcons.length];
                return (
                  <div key={item.title + i} className="space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SOCIAL PROOF */}
      {(testimonials.length > 0 || galleryImages.length > 0) && (
        <section className="bg-[#0c0b0a] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
          <div className="container-page grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
                Social proof
              </p>
              <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Real wardrobes. Real confidence.
              </h2>
              <div className="mt-8 grid gap-4">
                {testimonials.map((quote) => (
                  <div
                    key={quote}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                  >
                    <div className="mb-3 flex gap-1 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{quote}</p>
                  </div>
                ))}
              </div>
            </div>
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-6 gap-3">
                {galleryImages.map((image, index) => (
                  <div
                    key={image + index}
                    className={
                      (index === 0 || index === 3 ? "col-span-4" : "col-span-2") +
                      " min-h-[180px] rounded-2xl bg-cover bg-center shadow-soft"
                    }
                    style={bg(image)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductStrip({
  title,
  eyebrow,
  href,
  products,
  muted = false,
}: {
  title: string;
  eyebrow: string;
  href: string;
  products: Product[];
  muted?: boolean;
}) {
  return (
    <section className={(muted ? "bg-surface" : "bg-background") + " section-pad"}>
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              {title}
            </h2>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link href={href}>
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!products.length &&
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
              />
            ))}
        </div>
      </div>
    </section>
  );
}
