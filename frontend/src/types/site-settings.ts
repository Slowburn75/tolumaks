export interface SiteBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  note: string;
}

export interface SiteSocial {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

export interface HomepageCategoryCard {
  name: string;
  href: string;
  image: string;
  copy: string;
}

export interface HomepageFeatureCard {
  title: string;
  image: string;
  href: string;
}

export interface HomepagePromo {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  href: string;
  cta: string;
}

export interface HomepagePromise {
  title: string;
  copy: string;
}

export interface SiteSettings {
  storeName: string;
  storeTagline: string;
  description: string;
  currency: string;
  currencySymbol: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  social: SiteSocial;
  bank: SiteBankDetails;
  freeShippingThreshold: number;
  taxRate: number;
  enableNewsletter: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  homepage: {
    categoryCards: HomepageCategoryCard[];
    promo: HomepagePromo;
    featureCards: HomepageFeatureCard[];
    promises: HomepagePromise[];
    testimonials: string[];
    galleryImages: string[];
  };
}

export const FALLBACK_SITE_SETTINGS: SiteSettings = {
  storeName: "Tolumak",
  storeTagline: "Premium fashion for the modern individual",
  description: "Discover curated collections of clothing, shoes, bags, and accessories.",
  currency: "NGN",
  currencySymbol: "₦",
  email: "hello@tolumak.com",
  phone: "+234 800 000 0000",
  address: "Lagos, Nigeria",
  whatsapp: "",
  social: {
    instagram: "https://instagram.com/tolumak",
    twitter: "https://twitter.com/tolumak",
    facebook: "https://facebook.com/tolumak",
    youtube: "",
  },
  bank: {
    bankName: "GTBank",
    accountName: "Tolumak Fashion Store",
    accountNumber: "0123456789",
    note: "Transfer the exact order total and use your order number as the transfer reference. Orders are processed after payment is confirmed.",
  },
  freeShippingThreshold: 50000,
  taxRate: 0,
  enableNewsletter: true,
  enableReviews: true,
  enableWishlist: true,
  homepage: {
    categoryCards: [
      {
        name: "Women",
        href: "/shop?gender=female",
        image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85",
        copy: "Dresses, sets, bags, and elevated daily wear.",
      },
      {
        name: "Men",
        href: "/shop?gender=male",
        image:
          "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
        copy: "Sharp essentials, sportswear, and confident layers.",
      },
      {
        name: "Kids",
        href: "/shop?ageGroup=children",
        image:
          "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85",
        copy: "Comfortable style for everyday movement.",
      },
      {
        name: "Shoes",
        href: "/shop?category=shoes",
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
        copy: "Sneakers, runners, and polished finishing pieces.",
      },
      {
        name: "Bags",
        href: "/shop?category=bags",
        image:
          "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85",
        copy: "Carry pieces with structure, texture, and presence.",
      },
    ],
    promo: {
      eyebrow: "Trending collection",
      title: "Built for the daily spotlight.",
      copy: "Discover the pieces customers keep coming back for.",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1500&q=85",
      href: "/shop?isBestSeller=true",
      cta: "Explore best sellers",
    },
    featureCards: [
      {
        title: "Weekend bags",
        image:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
        href: "/shop?category=bags",
      },
      {
        title: "Performance sneakers",
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
        href: "/shop?category=shoes",
      },
    ],
    promises: [
      { title: "Verified quality", copy: "Every listing is checked for presentation and buyer confidence." },
      { title: "Fast delivery", copy: "Clear delivery expectations before checkout." },
      { title: "Easy returns", copy: "A cleaner return flow for safer shopping decisions." },
      { title: "Premium curation", copy: "Fashion-first discovery across men, women, kids, shoes, and bags." },
    ],
    testimonials: [
      "The shopping flow feels clean and trustworthy.",
      "Quality pieces that photograph beautifully.",
      "Fast delivery and the packaging felt premium.",
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=85",
      "https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=700&q=85",
    ],
  },
};
