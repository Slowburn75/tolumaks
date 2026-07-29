"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuth";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";

const links = [
  { label: "Women", href: "/shop?gender=female" },
  { label: "Men", href: "/shop?gender=male" },
  { label: "Kids", href: "/shop?ageGroup=children" },
  { label: "Shoes", href: "/shop?category=shoes" },
  { label: "Bags", href: "/shop?category=bags" },
  { label: "New in", href: "/shop?isNewArrival=true" },
  { label: "Sale", href: "/shop?sale=true" },
];

export function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");
  if (!isOpen) return null;

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      window.location.href = "/shop?search=" + encodeURIComponent(q);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-border px-5">
        <Link
          href="/"
          onClick={onClose}
          className="font-display text-lg font-medium tracking-[0.24em]"
        >
          {(settings.storeName || "Tolumak").toUpperCase()}
        </Link>
        <button onClick={onClose} aria-label="Close" className="p-2">
          <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </div>

      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto px-5 pb-28 pt-6">
        <div className="relative mb-8 border-b border-border pb-4">
          <Search className="absolute left-0 top-1 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="Search"
            className="h-9 border-0 bg-transparent pl-7 shadow-none focus-visible:ring-0"
          />
        </div>

        <nav className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="border-b border-border py-4 text-[12px] font-medium uppercase tracking-[0.2em]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background p-5">
        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{user?.name}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard" onClick={onClose}>
                Account
              </Link>
            </Button>
            <button
              className="w-full py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link href="/login" onClick={onClose}>
                Sign in
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register" onClick={onClose}>
                Register
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
