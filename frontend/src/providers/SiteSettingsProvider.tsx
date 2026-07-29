"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, unwrapData } from "@/lib/api";
import { FALLBACK_SITE_SETTINGS, type SiteSettings } from "@/types/site-settings";

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: FALLBACK_SITE_SETTINGS,
  loading: true,
  refresh: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get("/settings");
      const data = unwrapData<SiteSettings>(res);
      if (data && typeof data === "object") {
        setSettings({
          ...FALLBACK_SITE_SETTINGS,
          ...data,
          social: { ...FALLBACK_SITE_SETTINGS.social, ...(data.social || {}) },
          bank: { ...FALLBACK_SITE_SETTINGS.bank, ...(data.bank || {}) },
          homepage: {
            ...FALLBACK_SITE_SETTINGS.homepage,
            ...(data.homepage || {}),
            promo: {
              ...FALLBACK_SITE_SETTINGS.homepage.promo,
              ...(data.homepage?.promo || {}),
            },
            categoryCards: data.homepage?.categoryCards?.length
              ? data.homepage.categoryCards
              : FALLBACK_SITE_SETTINGS.homepage.categoryCards,
            featureCards: data.homepage?.featureCards?.length
              ? data.homepage.featureCards
              : FALLBACK_SITE_SETTINGS.homepage.featureCards,
            promises: data.homepage?.promises?.length
              ? data.homepage.promises
              : FALLBACK_SITE_SETTINGS.homepage.promises,
            testimonials: data.homepage?.testimonials?.length
              ? data.homepage.testimonials
              : FALLBACK_SITE_SETTINGS.homepage.testimonials,
            galleryImages: data.homepage?.galleryImages?.length
              ? data.homepage.galleryImages
              : FALLBACK_SITE_SETTINGS.homepage.galleryImages,
          },
        });
      }
    } catch {
      // keep fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
