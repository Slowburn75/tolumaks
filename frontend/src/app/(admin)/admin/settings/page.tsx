"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageField } from "@/components/admin/ImageField";
import { adminApi, unwrapData } from "@/lib/api";
import { FALLBACK_SITE_SETTINGS, type SiteSettings } from "@/types/site-settings";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((res) => {
        const data = unwrapData<SiteSettings>(res);
        if (data) {
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
      })
      .catch(() => toast.error("Could not load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings as unknown as Record<string, unknown>);
      toast.success("Settings saved — live on the storefront");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-muted-foreground py-12 text-center">Loading settings…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Store Settings</h1>
            <p className="text-sm text-muted-foreground">
              Bank details, contact info, homepage images, and store identity.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save all changes"}
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="bank">Bank transfer</TabsTrigger>
            <TabsTrigger value="contact">Contact & social</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store identity</CardTitle>
                <CardDescription>Shown in footer, meta, and emails.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store name</Label>
                  <Input value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={settings.storeTagline} onChange={(e) => set("storeTagline", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={settings.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={settings.currency} onChange={(e) => set("currency", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency symbol</Label>
                  <Input
                    value={settings.currencySymbol}
                    onChange={(e) => set("currencySymbol", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free shipping threshold (₦)</Label>
                  <Input
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => set("freeShippingThreshold", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => set("taxRate", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank transfer details</CardTitle>
                <CardDescription>
                  Shown at checkout, order success, and order detail pages while payment is pending.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank name</Label>
                  <Input
                    value={settings.bank.bankName}
                    onChange={(e) =>
                      set("bank", { ...settings.bank, bankName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account name</Label>
                  <Input
                    value={settings.bank.accountName}
                    onChange={(e) =>
                      set("bank", { ...settings.bank, accountName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Account number</Label>
                  <Input
                    value={settings.bank.accountNumber}
                    onChange={(e) =>
                      set("bank", { ...settings.bank, accountNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Payment instructions</Label>
                  <Textarea
                    rows={3}
                    value={settings.bank.note}
                    onChange={(e) => set("bank", { ...settings.bank, note: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact details</CardTitle>
                <CardDescription>Contact page, footer, and customer service.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (optional)</Label>
                  <Input
                    value={settings.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                    placeholder="+234…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={settings.address} onChange={(e) => set("address", e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Social links</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {(["instagram", "twitter", "facebook", "youtube"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key}</Label>
                    <Input
                      value={settings.social[key]}
                      onChange={(e) =>
                        set("social", { ...settings.social, [key]: e.target.value })
                      }
                      placeholder="https://"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homepage" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hero banners</CardTitle>
                <CardDescription>
                  Hero slideshow is managed under{" "}
                  <a href="/admin/banners" className="underline font-medium">
                    Banners
                  </a>
                  . Upload hero images there.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category cards</CardTitle>
                <CardDescription>Editorial category grid on the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.homepage.categoryCards.map((card, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive"
                      onClick={() =>
                        set("homepage", {
                          ...settings.homepage,
                          categoryCards: settings.homepage.categoryCards.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={card.name}
                          onChange={(e) => {
                            const categoryCards = [...settings.homepage.categoryCards];
                            categoryCards[i] = { ...card, name: e.target.value };
                            set("homepage", { ...settings.homepage, categoryCards });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <Input
                          value={card.href}
                          onChange={(e) => {
                            const categoryCards = [...settings.homepage.categoryCards];
                            categoryCards[i] = { ...card, href: e.target.value };
                            set("homepage", { ...settings.homepage, categoryCards });
                          }}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Copy</Label>
                        <Input
                          value={card.copy}
                          onChange={(e) => {
                            const categoryCards = [...settings.homepage.categoryCards];
                            categoryCards[i] = { ...card, copy: e.target.value };
                            set("homepage", { ...settings.homepage, categoryCards });
                          }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <ImageField
                          label="Image"
                          value={card.image}
                          onChange={(url) => {
                            const categoryCards = [...settings.homepage.categoryCards];
                            categoryCards[i] = { ...card, image: url };
                            set("homepage", { ...settings.homepage, categoryCards });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    set("homepage", {
                      ...settings.homepage,
                      categoryCards: [
                        ...settings.homepage.categoryCards,
                        { name: "New card", href: "/shop", image: "", copy: "" },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add category card
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promo block</CardTitle>
                <CardDescription>Large featured collection tile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input
                      value={settings.homepage.promo.eyebrow}
                      onChange={(e) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, eyebrow: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA label</Label>
                    <Input
                      value={settings.homepage.promo.cta}
                      onChange={(e) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, cta: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={settings.homepage.promo.title}
                      onChange={(e) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Copy</Label>
                    <Textarea
                      rows={2}
                      value={settings.homepage.promo.copy}
                      onChange={(e) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, copy: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Link</Label>
                    <Input
                      value={settings.homepage.promo.href}
                      onChange={(e) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, href: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <ImageField
                      label="Promo image"
                      value={settings.homepage.promo.image}
                      onChange={(url) =>
                        set("homepage", {
                          ...settings.homepage,
                          promo: { ...settings.homepage.promo, image: url },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature cards</CardTitle>
                <CardDescription>Small tiles next to the promo (e.g. bags, sneakers).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.homepage.featureCards.map((card, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive"
                      onClick={() =>
                        set("homepage", {
                          ...settings.homepage,
                          featureCards: settings.homepage.featureCards.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={card.title}
                          onChange={(e) => {
                            const featureCards = [...settings.homepage.featureCards];
                            featureCards[i] = { ...card, title: e.target.value };
                            set("homepage", { ...settings.homepage, featureCards });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <Input
                          value={card.href}
                          onChange={(e) => {
                            const featureCards = [...settings.homepage.featureCards];
                            featureCards[i] = { ...card, href: e.target.value };
                            set("homepage", { ...settings.homepage, featureCards });
                          }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <ImageField
                          label="Image"
                          value={card.image}
                          onChange={(url) => {
                            const featureCards = [...settings.homepage.featureCards];
                            featureCards[i] = { ...card, image: url };
                            set("homepage", { ...settings.homepage, featureCards });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    set("homepage", {
                      ...settings.homepage,
                      featureCards: [
                        ...settings.homepage.featureCards,
                        { title: "New feature", href: "/shop", image: "" },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add feature card
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promises / trust row</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.homepage.promises.map((p, i) => (
                  <div key={i} className="grid sm:grid-cols-2 gap-3 border rounded-lg p-3">
                    <Input
                      placeholder="Title"
                      value={p.title}
                      onChange={(e) => {
                        const promises = [...settings.homepage.promises];
                        promises[i] = { ...p, title: e.target.value };
                        set("homepage", { ...settings.homepage, promises });
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Copy"
                        value={p.copy}
                        onChange={(e) => {
                          const promises = [...settings.homepage.promises];
                          promises[i] = { ...p, copy: e.target.value };
                          set("homepage", { ...settings.homepage, promises });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          set("homepage", {
                            ...settings.homepage,
                            promises: settings.homepage.promises.filter((_, j) => j !== i),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set("homepage", {
                      ...settings.homepage,
                      promises: [...settings.homepage.promises, { title: "", copy: "" }],
                    })
                  }
                >
                  Add promise
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testimonials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.homepage.testimonials.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={t}
                      onChange={(e) => {
                        const testimonials = [...settings.homepage.testimonials];
                        testimonials[i] = e.target.value;
                        set("homepage", { ...settings.homepage, testimonials });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        set("homepage", {
                          ...settings.homepage,
                          testimonials: settings.homepage.testimonials.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set("homepage", {
                      ...settings.homepage,
                      testimonials: [...settings.homepage.testimonials, ""],
                    })
                  }
                >
                  Add testimonial
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery images</CardTitle>
                <CardDescription>Social proof grid at the bottom of the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.homepage.galleryImages.map((img, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <ImageField
                        label={`Image ${i + 1}`}
                        value={img}
                        onChange={(url) => {
                          const galleryImages = [...settings.homepage.galleryImages];
                          galleryImages[i] = url;
                          set("homepage", { ...settings.homepage, galleryImages });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() =>
                        set("homepage", {
                          ...settings.homepage,
                          galleryImages: settings.homepage.galleryImages.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set("homepage", {
                      ...settings.homepage,
                      galleryImages: [...settings.homepage.galleryImages, ""],
                    })
                  }
                >
                  Add gallery image
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature toggles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    ["enableNewsletter", "Newsletter signup"],
                    ["enableReviews", "Product reviews"],
                    ["enableWishlist", "Wishlist"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={settings[key]}
                      onCheckedChange={(v) => set(key, v)}
                    />
                  </label>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pb-12">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? "Saving…" : "Save all changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
