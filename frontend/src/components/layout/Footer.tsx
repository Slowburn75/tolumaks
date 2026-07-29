"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { footerLinks } from "@/lib/constants";
import { newsletterApi } from "@/lib/api";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import toast from "react-hot-toast";

export function Footer() {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email);
      toast.success("Subscribed");
      setEmail("");
    } catch {
      toast.error("Could not subscribe");
    } finally {
      setLoading(false);
    }
  };

  const social = [
    { Icon: Instagram, href: settings.social.instagram },
    { Icon: Twitter, href: settings.social.twitter },
    { Icon: Facebook, href: settings.social.facebook },
    { Icon: Youtube, href: settings.social.youtube },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto border-t border-border bg-background">
      {settings.enableNewsletter && (
        <div className="border-b border-border">
          <div className="container-page flex flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-end lg:px-12 xl:px-16">
            <div>
              <p className="eyebrow-dior">Newsletter</p>
              <h3 className="mt-3 font-display text-2xl font-normal tracking-tight sm:text-3xl">
                Stay informed
              </h3>
            </div>
            <form
              onSubmit={handleNewsletter}
              className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-none border-border bg-transparent px-0 shadow-none focus-visible:ring-0 border-0 border-b"
                required
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? "…" : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="container-page grid grid-cols-2 gap-10 px-5 py-14 sm:px-8 md:grid-cols-4 lg:px-12 lg:py-16 xl:px-16">
        <div className="col-span-2 md:col-span-1">
          <Link
            href="/"
            className="font-display text-xl font-medium tracking-[0.2em]"
          >
            {(settings.storeName || "Tolumak").toUpperCase()}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {settings.storeTagline || settings.description}
          </p>
          {social.length > 0 && (
            <div className="mt-6 flex gap-4">
              {social.map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow-dior">Client services</p>
          <ul className="mt-5 space-y-3">
            {footerLinks.customerService.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow-dior">The house</p>
          <ul className="mt-5 space-y-3">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow-dior">Contact</p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            <li>{settings.address}</li>
            <li>
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                {settings.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="hover:text-foreground">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-4 px-5 py-6 sm:px-8 md:flex-row lg:px-12 xl:px-16">
          <p className="text-[11px] tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} {settings.storeName}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] tracking-wide text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
