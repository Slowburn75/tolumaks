"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook, Youtube, ArrowRight } from "lucide-react";
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
      toast.success("Subscribed successfully!");
      setEmail("");
    } catch {
      toast.error("Subscription failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const social = [
    { Icon: Instagram, href: settings.social.instagram, label: "Instagram" },
    { Icon: Twitter, href: settings.social.twitter, label: "Twitter" },
    { Icon: Facebook, href: settings.social.facebook, label: "Facebook" },
    { Icon: Youtube, href: settings.social.youtube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/60 bg-[#0c0b0a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="container-page relative px-4 sm:px-6 lg:px-8">
        {settings.enableNewsletter && (
          <div className="border-b border-white/10 py-12 lg:py-16">
            <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                  Newsletter
                </p>
                <h3 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
                  Stay in the edit.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                  New arrivals, private drops, and member-only offers from {settings.storeName}.
                </p>
              </div>
              <form onSubmit={handleNewsletter} className="flex w-full flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 flex-1 rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  required
                />
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/90"
                  disabled={loading}
                >
                  {loading ? "…" : "Subscribe"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-semibold tracking-wide">
              {settings.storeName}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              {settings.description || settings.storeTagline}
            </p>
            {social.length > 0 && (
              <div className="mt-6 flex gap-2">
                {social.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white hover:text-black"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Shop
            </h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Support
            </h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.customerService.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Contact
            </h4>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/65">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/65">
                <Phone className="h-4 w-4 shrink-0 text-white/40" />
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-white"
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/65">
                <Mail className="h-4 w-4 shrink-0 text-white/40" />
                <a href={`mailto:${settings.email}`} className="transition-colors hover:text-white">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 md:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-white/40 transition-colors hover:text-white/70"
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
