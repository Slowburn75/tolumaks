"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { bannersApi, productsApi } from "@/lib/api";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import type { Product } from "@/types";

const bg = (image: string) => ({ backgroundImage: `url(${image})` });

type HeroSlide = {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  href: string;
  cta: string;
};

const defaultHero: HeroSlide[] = [
  {
    eyebrow: "Spring / Summer",
    title: "The new season",
    copy: "Essential silhouettes. Elevated materials.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=85",
    href: "/shop?isNewArrival=true",
    cta: "Shop now",
  },
  {
    eyebrow: "Women",
    title: "Quiet luxury",
    copy: "Modern pieces for every day.",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2400&q=85",
    href: "/shop?gender=female",
    cta: "Explore women",
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

/** Zara + COS: full-bleed editorial, sparse copy, large type, restrained CTAs */
export function PremiumHomePage() {
  const { settings } = useSiteSettings();
  const hp = settings.homepage;
  const [active, setActive] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultHero);
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
              "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85",
            copy: "",
          },
          {
            name: "Men",
            href: "/shop?gender=male",
            image:
              "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=85",
            copy: "",
          },
          {
            name: "Shoes",
            href: "/shop?category=shoes",
            image:
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
            copy: "",
          },
          {
            name: "Bags",
            href: "/shop?category=bags",
            image:
              "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=85",
            copy: "",
          },
        ];

  useEffect(() => {
    const t = window.setInterval(
      () => setActive((v) => (v + 1) % Math.max(heroSlides.length, 1)),
      7000
    );
    return () => window.clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    productsApi.getNewArrivals(8).then((r) => setNewArrivals(pickList(r))).catch(() => {});
    productsApi.getBestSellers(8).then((r) => setBestSellers(pickList(r))).catch(() => {});
    bannersApi
      .getActive()
      .then((res) => {
        const list = pickList<{ title: string; subtitle?: string; image: string; link?: string }>(res);
        if (list.length) {
          setHeroSlides(
            list.map((b) => ({
              eyebrow: "Featured",
              title: b.title,
              copy: b.subtitle || "",
              image: b.image,
              href: b.link || "/shop",
              cta: "Shop now",
            }))
          );
          setActive(0);
        }
      })
      .catch(() => {});
  }, []);

  const slide = heroSlides[active] || defaultHero[0];
  const promo = hp.promo;

  return (
    <main>
      {/* HERO — Zara full bleed */}
      <section className="relative h-[100svh] min-h-[560px] max-h-[920px] bg-black text-white">
        {heroSlides.map((item, i) => (
          <div
            key={item.title + i}
            className={
              "absolute inset-0 transition-opacity duration-1000 ease-luxury " +
              (i === active ? "opacity-100" : "opacity-0")
            }
          >
            <div className="absolute inset-0 bg-cover bg-center" style={bg(item.image)} />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        ))}

        <div className="container-page relative flex h-full flex-col items-center justify-end px-5 pb-16 text-center sm:px-8 lg:pb-20">
          <div className="fade-up max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/75">
              {slide.eyebrow}
            </p>
            <h1 className="mt-5 font-display text-5xl font-normal leading-[1.05] tracking-[-0.02em] sm:text-6xl md:text-7xl lg:text-8xl">
              {slide.title}
            </h1>
            {slide.copy && (
              <p className="mx-auto mt-5 max-w-md text-sm font-light tracking-wide text-white/80">
                {slide.copy}
              </p>
            )}
            <Link
              href={slide.href}
              className="mt-8 inline-block border border-white/80 px-10 py-3.5 text-[10px] font-medium uppercase tracking-[0.28em] text-white transition-colors duration-500 hover:bg-white hover:text-black"
            >
              {slide.cta}
            </Link>
          </div>

          {heroSlides.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={
                    "h-px transition-all duration-500 " +
                    (i === active ? "w-10 bg-white" : "w-5 bg-white/40")
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES — COS 2×2 editorial */}
      <section className="section-lv">
        <div className="container-page">
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">
              Shop by category
            </h2>
            <Link
              href="/shop"
              className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.name} href={cat.href} className="group relative block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f0f0f0]">
                  <div
                    className="img-aritzia absolute inset-0 bg-cover bg-center"
                    style={bg(cat.image)}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
                </div>
                <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.2em]">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW IN */}
      <ProductStrip title="New in" href="/shop?isNewArrival=true" products={newArrivals} />

      {/* PROMO — single full-width Zara moment */}
      {promo && (
        <section className="relative">
          <Link href={promo.href || "/shop"} className="group relative block h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden bg-black text-white">
            <div
              className="img-aritzia absolute inset-0 bg-cover bg-center"
              style={bg(promo.image)}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/70">
                {promo.eyebrow}
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-normal tracking-tight sm:text-5xl md:text-6xl">
                {promo.title}
              </h2>
              {promo.copy && (
                <p className="mt-4 max-w-md text-sm font-light text-white/75">{promo.copy}</p>
              )}
              <span className="mt-8 border border-white/80 px-10 py-3.5 text-[10px] font-medium uppercase tracking-[0.28em] transition-colors duration-500 group-hover:bg-white group-hover:text-black">
                {promo.cta || "Discover"}
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* FEATURE TILES */}
      {(hp.featureCards?.length ?? 0) > 0 && (
        <section className="section-lv">
          <div className="container-page grid gap-3 md:grid-cols-2 md:gap-4">
            {hp.featureCards.map((item) => (
              <Link key={item.title} href={item.href} className="group relative block">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f0f0f0] md:aspect-[5/3]">
                  <div
                    className="img-aritzia absolute inset-0 bg-cover bg-center"
                    style={bg(item.image)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                    <h3 className="font-display text-2xl font-normal text-white sm:text-3xl">
                      {item.title}
                    </h3>
                    <span className="mt-3 inline-block text-[10px] font-medium uppercase tracking-[0.22em] text-white/80">
                      Shop now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductStrip title="Bestsellers" href="/shop?isBestSeller=true" products={bestSellers} muted />

      {/* TRUST — LV quiet strip */}
      {(hp.promises?.length ?? 0) > 0 && (
        <section className="border-t border-border">
          <div className="container-page grid gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-12 lg:py-20 xl:px-16">
            {hp.promises.map((p) => (
              <div key={p.title} className="text-center md:text-left">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.18em]">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.copy}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductStrip({
  title,
  href,
  products,
  muted,
}: {
  title: string;
  href: string;
  products: Product[];
  muted?: boolean;
}) {
  return (
    <section className={(muted ? "bg-surface" : "bg-background") + " section-lv"}>
      <div className="container-page">
        <div className="mb-12 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-normal tracking-tight sm:text-4xl">{title}</h2>
          <Link
            href={href}
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5 md:gap-y-14">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {!products.length &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-[#f0f0f0]" />
            ))}
        </div>
      </div>
    </section>
  );
}
