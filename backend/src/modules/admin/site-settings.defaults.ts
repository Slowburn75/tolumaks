/** Default storefront content — admin can override everything via Store Settings */

export const DEFAULT_SITE_SETTINGS = {
  storeName: 'Tolumak',
  storeTagline: 'Premium fashion for the modern individual',
  description:
    'Discover curated collections of clothing, shoes, bags, and accessories.',
  currency: 'NGN',

  email: 'hello@tolumak.com',
  phone: '+234 800 000 0000',
  address: 'Lagos, Nigeria',
  whatsapp: '',

  social: {
    instagram: 'https://instagram.com/tolumak',
    twitter: 'https://twitter.com/tolumak',
    facebook: 'https://facebook.com/tolumak',
    youtube: '',
  },

  bank: {
    bankName: 'GTBank',
    accountName: 'Tolumak Fashion Store',
    accountNumber: '0123456789',
    note: 'Transfer the exact order total and use your order number as the transfer reference. Orders are processed after payment is confirmed.',
  },

  freeShippingThreshold: 50000,
  taxRate: 0,
  currencySymbol: '₦',

  enableNewsletter: true,
  enableReviews: true,
  enableWishlist: true,

  homepage: {
    categoryCards: [
      {
        name: 'Women',
        href: '/shop?gender=female',
        image:
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=85',
        copy: 'Dresses, sets, bags, and elevated daily wear.',
      },
      {
        name: 'Men',
        href: '/shop?gender=male',
        image:
          'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85',
        copy: 'Sharp essentials, sportswear, and confident layers.',
      },
      {
        name: 'Kids',
        href: '/shop?ageGroup=children',
        image:
          'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85',
        copy: 'Comfortable style for everyday movement.',
      },
      {
        name: 'Shoes',
        href: '/shop?category=shoes',
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
        copy: 'Sneakers, runners, and polished finishing pieces.',
      },
      {
        name: 'Bags',
        href: '/shop?category=bags',
        image:
          'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85',
        copy: 'Carry pieces with structure, texture, and presence.',
      },
    ],
    promo: {
      eyebrow: 'Trending collection',
      title: 'Built for the daily spotlight.',
      copy: 'Discover the pieces customers keep coming back for: easy silhouettes, bold sneakers, polished bags, and refined basics.',
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1500&q=85',
      href: '/shop?isBestSeller=true',
      cta: 'Explore best sellers',
    },
    featureCards: [
      {
        title: 'Weekend bags',
        image:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
        href: '/shop?category=bags',
      },
      {
        title: 'Performance sneakers',
        image:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85',
        href: '/shop?category=shoes',
      },
    ],
    promises: [
      {
        title: 'Verified quality',
        copy: 'Every listing is checked for presentation and buyer confidence.',
      },
      {
        title: 'Fast delivery',
        copy: 'Clear delivery expectations before checkout.',
      },
      {
        title: 'Easy returns',
        copy: 'A cleaner return flow for safer shopping decisions.',
      },
      {
        title: 'Premium curation',
        copy: 'Fashion-first discovery across men, women, kids, shoes, and bags.',
      },
    ],
    testimonials: [
      'The shopping flow feels clean and trustworthy.',
      'Quality pieces that photograph beautifully.',
      'Fast delivery and the packaging felt premium.',
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=700&q=85',
    ],
  },
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

export function mergeSiteSettings(stored: unknown): SiteSettings {
  const data = (stored && typeof stored === 'object' ? stored : {}) as Record<string, any>;
  const defaults = DEFAULT_SITE_SETTINGS;

  return {
    ...defaults,
    ...data,
    social: { ...defaults.social, ...(data.social || {}) },
    bank: { ...defaults.bank, ...(data.bank || {}) },
    homepage: {
      ...defaults.homepage,
      ...(data.homepage || {}),
      categoryCards: data.homepage?.categoryCards ?? defaults.homepage.categoryCards,
      promo: { ...defaults.homepage.promo, ...(data.homepage?.promo || {}) },
      featureCards: data.homepage?.featureCards ?? defaults.homepage.featureCards,
      promises: data.homepage?.promises ?? defaults.homepage.promises,
      testimonials: data.homepage?.testimonials ?? defaults.homepage.testimonials,
      galleryImages: data.homepage?.galleryImages ?? defaults.homepage.galleryImages,
    },
    // Legacy flat bank fields → nested bank
    ...(data.bankName || data.accountName || data.accountNumber
      ? {
          bank: {
            bankName: data.bank?.bankName || data.bankName || defaults.bank.bankName,
            accountName: data.bank?.accountName || data.accountName || defaults.bank.accountName,
            accountNumber:
              data.bank?.accountNumber || data.accountNumber || defaults.bank.accountNumber,
            note: data.bank?.note || data.bankNote || defaults.bank.note,
          },
        }
      : {}),
    // Legacy email fields
    email: data.email || data.storeEmail || defaults.email,
    phone: data.phone || data.storePhone || defaults.phone,
    address: data.address || data.storeAddress || defaults.address,
    storeName: data.storeName || defaults.storeName,
  };
}
